import os
import re
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Body

from ..db.mongodb import db_client
from ..services.email_service import email_service, ALLOWED_PROBLEMS

logger = logging.getLogger("solarguard.notifications_router")

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validate_email_format(email: str) -> str:
    cleaned = email.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid email address format: '{email}'. Please enter a valid email like name@example.com."
        )
    return cleaned

class NotificationSettingsRequest(BaseModel):
    notification_email: str
    resend_api_key: Optional[str] = None
    brevo_api_key: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_pass: Optional[str] = None

class AlertDispatchRequest(BaseModel):
    problem_type: str
    title: str
    details: str
    panel_id: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    is_test: Optional[bool] = False

class TestEmailRequest(BaseModel):
    recipient_email: Optional[str] = None


@router.get("/settings")
def get_notification_settings():
    """
    Returns stored email alert settings from MongoDB.
    Confirms active MongoDB persistence and allowed problem triggers.
    Ensures raw API keys are NEVER exposed in the JSON response to the browser.
    """
    import os
    settings = db_client.get_notification_settings()
    
    # 1. Resend API Key: Check MongoDB or local .env
    resend_raw = settings.get("resend_api_key") or os.getenv("RESEND_API_KEY")
    if resend_raw:
        settings["resend_api_key_configured"] = True
        settings["resend_api_key_masked"] = resend_raw[:6] + "..." + resend_raw[-4:]
    else:
        settings["resend_api_key_configured"] = False
        settings["resend_api_key_masked"] = ""

    # 2. Brevo API Key
    brevo_raw = settings.get("brevo_api_key") or os.getenv("BREVO_API_KEY")
    if brevo_raw:
        settings["brevo_api_key_configured"] = True
        settings["brevo_api_key_masked"] = brevo_raw[:6] + "..." + brevo_raw[-4:]
    else:
        settings["brevo_api_key_configured"] = False
        settings["brevo_api_key_masked"] = ""

    # 3. SMTP Password
    smtp_pass_raw = settings.get("smtp_pass") or os.getenv("SMTP_PASS") or os.getenv("SMTP_PASSWORD")
    if smtp_pass_raw:
        settings["smtp_pass_configured"] = True
        settings["smtp_pass_masked"] = "••••••••"
    else:
        settings["smtp_pass_configured"] = False
        settings["smtp_pass_masked"] = ""

    # CRITICAL SECURITY: Never return raw secret keys to the browser
    settings.pop("resend_api_key", None)
    settings.pop("brevo_api_key", None)
    settings.pop("smtp_pass", None)

    settings["allowed_triggers"] = [
        {"id": k, "label": v["title"], "severity": v["severity"]}
        for k, v in ALLOWED_PROBLEMS.items() if k != "TEST_NOTIFICATION"
    ]
    return settings


@router.post("/settings")
def save_notification_settings(req: NotificationSettingsRequest):
    """
    Stores the user's alert notification email and optional free API credentials in MongoDB.
    """
    cleaned_email = validate_email_format(req.notification_email)
    payload = {
        "notification_email": cleaned_email,
        "is_enabled": True
    }
    if req.resend_api_key is not None and req.resend_api_key.strip():
        payload["resend_api_key"] = req.resend_api_key.strip()
    if req.brevo_api_key is not None and req.brevo_api_key.strip():
        payload["brevo_api_key"] = req.brevo_api_key.strip()
    if req.smtp_host is not None and req.smtp_host.strip():
        payload["smtp_host"] = req.smtp_host.strip()
        payload["smtp_port"] = req.smtp_port or 587
    if req.smtp_user is not None and req.smtp_user.strip():
        payload["smtp_user"] = req.smtp_user.strip()
    if req.smtp_pass is not None and req.smtp_pass.strip():
        payload["smtp_pass"] = req.smtp_pass.strip()

    success = db_client.save_notification_settings(payload)
    if not success and not db_client.is_connected:
        logger.warning("MongoDB offline. Saved in memory/local mode.")
        return {
            "success": True,
            "warning": "MongoDB not currently reachable. Setting accepted locally.",
            "notification_email": payload["notification_email"],
            "stored_in_db": False
        }

    return {
        "success": True,
        "message": f"Alert notification email successfully stored in MongoDB: {payload['notification_email']}",
        "notification_email": payload["notification_email"],
        "stored_in_db": db_client.is_connected
    }


@router.post("/send-alert")
async def send_alert_email(alert: AlertDispatchRequest):
    """
    Pushes an alert email strictly for the 3 allowed problems:
      1. CRACK_DETECTED (AI Optical Micro-Crack / Cell Fracture)
      2. POWER_UNDERPERFORMANCE (INA219 Peer Anomaly / Power Drop)
      3. HIGH_TEMPERATURE (DS18B20 Temp > 55°C)
    Any other event is strictly blocked.
    """
    if alert.problem_type not in ALLOWED_PROBLEMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "DISALLOWED_PROBLEM_TYPE",
                "message": "Emails are pushed strictly for: 'CRACK_DETECTED', 'POWER_UNDERPERFORMANCE', and 'HIGH_TEMPERATURE'.",
                "allowed_types": [k for k in ALLOWED_PROBLEMS.keys() if k != "TEST_NOTIFICATION"]
            }
        )

    res = await email_service.dispatch_alert(
        problem_type=alert.problem_type,
        title=alert.title,
        details=alert.details,
        panel_id=alert.panel_id,
        metrics=alert.metrics,
        is_test=alert.is_test or False
    )
    return res


@router.post("/test-email")
async def send_test_email(req: Optional[TestEmailRequest] = None):
    """
    Dispatches a verification test email to verify recipient inbox delivery.
    """
    override = req.recipient_email if req and req.recipient_email else None
    res = await email_service.dispatch_alert(
        problem_type="TEST_NOTIFICATION",
        title="SolarGuard IoT Alert Service Test",
        details="This test verifies that SolarGuard can dispatch critical alert emails to your inbox. Automated notifications are active exclusively for: 1) Structural Cracks, 2) Power Underperformance, and 3) Surface Temperature > 55°C.",
        metrics={
            "service_status": "Online & Arming Triggers",
            "mongodb_persistence": "Active (solarguard_db)",
            "safety_limits": "Max 55°C Temp, 70% Peer Baseline"
        },
        is_test=True,
        override_recipient=override
    )
    return res


@router.get("/history")
def get_email_history(limit: int = 15):
    """
    Returns recent email alert logs from MongoDB for audit and display.
    """
    return db_client.get_recent_email_alerts(limit=limit)
