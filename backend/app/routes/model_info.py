from fastapi import APIRouter
from ..config import MODEL_PATH, DEVICE, DEFAULT_CONFIDENCE_THRESHOLD, CRACK_CONFIDENCE_THRESHOLD

router = APIRouter(prefix="/api/model", tags=["Model Info"])

_classifier = None

def set_classifier_for_info(clf):
    global _classifier
    _classifier = clf

@router.get("/info")
def get_model_info():
    """Returns architecture, classes, and checkpoint loading status."""
    is_loaded = _classifier.is_loaded if _classifier else False
    return {
        "model_name": "SolarGuard MobileNetV3-Small",
        "task_type": "Multi-Label Surface Classification",
        "is_loaded": is_loaded,
        "device": str(_classifier.device) if _classifier else DEVICE,
        "supported_classes": _classifier.classes if _classifier else ["crack", "dust", "bird_droppings", "snow"],
        "expected_input_shape": "(1, 3, 224, 224)",
        "configured_checkpoint_path": MODEL_PATH,
        "loaded_checkpoint_path": _classifier.checkpoint_path if _classifier else None,
        "loaded_at": _classifier.loaded_at if _classifier else None,
        "load_error": _classifier.load_error if _classifier else None,
        "default_threshold": getattr(_classifier, "threshold", DEFAULT_CONFIDENCE_THRESHOLD),
        "crack_threshold": getattr(_classifier, "crack_threshold", CRACK_CONFIDENCE_THRESHOLD),
        "best_val_loss": getattr(_classifier, "best_val_loss", None),
        "epochs_completed": getattr(_classifier, "epochs_completed", None),
        "transfer_instructions": "Place solarguard_mobilenetv3_50epoch_finetuned.pt in backend/models/ or specify MODEL_PATH env variable."
    }


@router.post("/reload")
def reload_model():
    """Hot-reloads the model checkpoint from MODEL_PATH."""
    if _classifier is None:
        return {"success": False, "message": "Classifier instance uninitialized"}
    success = _classifier.load_checkpoint(MODEL_PATH)
    return {
        "success": success,
        "is_loaded": _classifier.is_loaded,
        "checkpoint_path": _classifier.checkpoint_path,
        "error": _classifier.load_error
    }
