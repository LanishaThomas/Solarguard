import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import MODEL_PATH, CORS_ORIGINS, DEVICE
from .model.classifier import MobileNetV3Classifier
from .routes.predict import router as predict_router, set_classifier
from .routes.model_info import router as info_router, set_classifier_for_info
from .routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("solarguard")

# Global classifier instance
classifier = MobileNetV3Classifier(device_name=DEVICE)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try to load fine-tuned checkpoint
    logger.info("Initializing SolarGuard MobileNetV3 Inference Service...")
    set_classifier(classifier)
    set_classifier_for_info(classifier)

    model_file = Path(MODEL_PATH)
    if model_file.exists():
        logger.info(f"Loading checkpoint from: {model_file.resolve()}")
        classifier.load_checkpoint(model_file)
    else:
        logger.warning(
            f"Checkpoint file '{model_file.name}' not found at {model_file.resolve()}. "
            "Initializing MobileNetV3-Small architecture baseline for pipeline readiness."
        )
        classifier.initialize_synthetic_baseline()

    yield
    logger.info("SolarGuard Inference Service shutting down.")

app = FastAPI(
    title="SolarGuard AI Inference API",
    description="Fine-tuned MobileNetV3-Small multi-label defect and soiling detection for smart solar arrays.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for React frontend communication
if "*" in CORS_ORIGINS or not CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Include routers
app.include_router(health_router)
app.include_router(predict_router)
app.include_router(info_router)

if __name__ == "__main__":
    import uvicorn
    from .config import HOST, PORT
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)
