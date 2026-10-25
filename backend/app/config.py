import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Model configuration
MODEL_FILENAME = os.getenv("MODEL_FILENAME", "solarguard_mobilenetv3_50epoch_finetuned.pt")
DEFAULT_MODEL_PATH = MODELS_DIR / MODEL_FILENAME
MODEL_PATH = os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))

# Inference parameters
DEVICE = os.getenv("DEVICE", "cuda" if False else "cpu")
DEFAULT_CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))
CRACK_CONFIDENCE_THRESHOLD = float(os.getenv("CRACK_THRESHOLD", "0.40"))  # Stricter for damage safety

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
cors_env = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [orig.strip() for orig in cors_env.split(",") if orig.strip()]

