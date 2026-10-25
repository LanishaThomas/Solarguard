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
    threshold: Optional[float] = Query(None, description="Custom confidence threshold override (0.1 to 0.95)"),
    engine: Optional[str] = Query("auto", description="Inference engine: 'groq', 'mobilenetv3', or 'auto'")
):
    """
    Classifies a solar panel image using fine-tuned MobileNetV3-Small or Groq Vision API.
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

        selected_engine = (engine or "auto").lower().strip()
        result = None

        # 1. User selected Groq Vision explicitly
        if selected_engine in ["groq", "cloud"]:
            try:
                from ..model.groq_vision import classify_surface_with_groq
                result = classify_surface_with_groq(image=image)
                if result:
                    result["engine_used"] = "Groq Vision Cloud AI (Qwen-27B)"
                    result["engine_type"] = "groq"
            except Exception as groq_err:
                logger.warning(f"Groq vision error: {groq_err}")

                # Fallback to local MobileNetV3 if Groq fails or rate limits
                if classifier_instance and classifier_instance.is_loaded:
                    result = classifier_instance.predict(image=image, threshold_override=threshold)
                    result["engine_used"] = "MobileNetV3 (Fallback: Groq rate-limited or offline)"
                    result["engine_type"] = "mobilenetv3"

        # 2. User selected Local MobileNetV3 ML Model explicitly
        elif selected_engine in ["mobilenetv3", "local", "ml"]:
            if classifier_instance and classifier_instance.is_loaded:
                result = classifier_instance.predict(image=image, threshold_override=threshold)
                result["engine_used"] = "MobileNetV3 Neural Network (Local ML Model)"
                result["engine_type"] = "mobilenetv3"
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Local MobileNetV3 model is not loaded."
                )

        # 3. Auto engine selection (Groq if available, else MobileNetV3)
        else:
            try:
                from ..model.groq_vision import classify_surface_with_groq
                result = classify_surface_with_groq(image=image)
                if result:
                    result["engine_used"] = "Groq Vision Cloud AI (Qwen-27B)"
                    result["engine_type"] = "groq"
            except Exception as groq_err:
                logger.warning(f"Groq vision attempt skipped: {groq_err}")

            if result is None:
                if classifier_instance and classifier_instance.is_loaded:
                    result = classifier_instance.predict(image=image, threshold_override=threshold)
                    result["engine_used"] = "MobileNetV3 Neural Network (Local ML Model)"
                    result["engine_type"] = "mobilenetv3"
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
