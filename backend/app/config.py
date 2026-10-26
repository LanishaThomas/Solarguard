import os
from pathlib import Path

# Load .env file automatically
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
except Exception:
    pass

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
DEFAULT_CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.52"))
CRACK_CONFIDENCE_THRESHOLD = float(os.getenv("CRACK_THRESHOLD", "0.52"))  # Calibrated for accurate detection

# Server configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
def normalize_origin(orig: str) -> str:
    orig = orig.strip()
    if orig == "*" or orig.startswith("http://") or orig.startswith("https://"):
        return orig.rstrip("/")
    return f"https://{orig.rstrip('/')}"

cors_env = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [normalize_origin(orig) for orig in cors_env.split(",") if orig.strip()]

# Groq Vision API configuration (Ultra-high accuracy surface detection)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip()

# EMQX Cloud MQTT Configuration
EMQX_BROKER = os.getenv("EMQX_BROKER", os.getenv("VITE_EMQX_BROKER", "v20f2113.ala.asia-southeast1.emqxsl.com"))
EMQX_PORT = int(os.getenv("EMQX_PORT", "8883"))
EMQX_USERNAME = os.getenv("EMQX_USERNAME", os.getenv("VITE_EMQX_USERNAME", ""))
EMQX_PASSWORD = os.getenv("EMQX_PASSWORD", os.getenv("VITE_EMQX_PASSWORD", ""))
EMQX_TOPIC_PREFIX = os.getenv("EMQX_TOPIC_PREFIX", os.getenv("VITE_EMQX_TOPIC_PREFIX", "solarguard"))




