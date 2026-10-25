import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from fastapi.responses import JSONResponse

from ..model.classifier import MobileNetV3Classifier
from ..utils.image_processing import load_image_from_bytes
from ..config import DEFAULT_CONFIDENCE_THRESHOLD, CRACK_CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Inference"])

# Singleton classifier instance managed by app state
classifier_instance: MobileNetV3Classifier = None

def set_classifier(clf: MobileNetV3Classifier):
    global classifier_instance
    classifier_instance = clf

@router.post("/predict")
async def predict_surface(
    file: UploadFile = File(..., description="Solar panel image (JPEG/PNG/WebP)"),
    threshold: Optional[float] = Query(None, description="Custom confidence threshold override (0.1 to 0.95)")
):
    """
    Classifies a solar panel image using fine-tuned MobileNetV3-Small.
    Outputs image classification probabilities for crack, dust, bird_droppings, snow, and clean.
    Enforces automatic wiper safety lockout when damage is suspected.
    """
    from ..config import GROQ_API_KEY
    if (classifier_instance is None or not classifier_instance.is_loaded) and not GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "MODEL_NOT_READY",
                "message": "MobileNetV3 model checkpoint is not loaded. Place solarguard_mobilenetv3_50epoch_finetuned.pt in backend/models/.",
                "checkpoint_path": classifier_instance.checkpoint_path if classifier_instance else None,
                "load_error": classifier_instance.load_error if classifier_instance else "Uninitialized"
            }
        )

    # Validate content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/octet-stream"]
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Please upload a JPEG, PNG, or WebP image."
        )

    try:
        contents = await file.read()
        image = load_image_from_bytes(contents)

        # 1. Primary high-accuracy visual inference via Groq vision (if API key configured)
        result = None
        try:
            from ..model.groq_vision import classify_surface_with_groq
            result = classify_surface_with_groq(image=image)
        except Exception as groq_err:
            logger.warning(f"Groq vision attempt skipped or failed: {groq_err}")

        # 2. Seamless local MobileNetV3 fallback if Groq not configured or offline
        if result is None:
            if classifier_instance and classifier_instance.is_loaded:
                result = classifier_instance.predict(image=image, threshold_override=threshold)
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Classification engine is temporarily unavailable."
                )

        # Log inspection record into MongoDB if connected
        try:
            from ..db.mongodb import db_client
            if db_client.is_connected:
                db_client.log_inspection(result)
        except Exception as db_err:
            logger.warning(f"MongoDB inspection log error: {db_err}")

        return JSONResponse(content=result)


    except Exception as e:
        logger.error(f"Inference error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image and run inference: {str(e)}"
        )
