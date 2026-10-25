from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Health"])

@router.get("/health")
@router.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "solarguard-inference-backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
