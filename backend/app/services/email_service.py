import os
import time
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import httpx
from dotenv import load_dotenv
load_dotenv()

from ..db.mongodb import db_client

logger = logging.getLogger("solarguard.email")

# ======================================================================================
# 3 SPECIFIC ALLOWED PROBLEM CATEGORIES (Strict Requirement)
# ======================================================================================
ALLOWED_PROBLEMS = {
    "CRACK_DETECTED": {
        "title": "🚨 Critical Defect: Panel Surface Crack Detected",
        "severity": "CRITICAL DAMAGE",
        "theme_color": "#dc2626",      # Red
        "badge_bg": "#fef2f2",
        "badge_text": "#991b1b",
        "default_action": "Automatic wiper lockout engaged. Physical repair/replacement required to prevent electrical arcing."
    },
    "PANEL_DISCONNECTED": {
        "title": "🔌 Critical Hardware Fault: Solar Panel Disconnected",
        "severity": "HARDWARE DISCONNECT",
        "theme_color": "#dc2626",      # Red
        "badge_bg": "#fef2f2",
        "badge_text": "#991b1b",
        "default_action": "Check physical wiring, INA219 sensor connections, screw terminals, or panel open-circuit immediately."
    },
    "POWER_UNDERPERFORMANCE": {
        "title": "⚡ Power Anomaly: Panel Output Significantly Underperforming",
        "severity": "POWER FAULT",
        "theme_color": "#d97706",      # Amber
        "badge_bg": "#fffbeb",
        "badge_text": "#92400e",
        "default_action": "Check panel for physical soiling, localized shading, micro-inverter fault, or loose INA219 wiring."
    },
    "HIGH_TEMPERATURE": {
        "title": "🌡️ Thermal Alert: Panel Surface Temperature Exceeds 55°C",
        "severity": "THERMAL HAZARD",
        "theme_color": "#ea580c",      # Orange
        "badge_bg": "#fff7ed",
        "badge_text": "#9a3412",
        "default_action": "Surface temperature exceeded safe operational threshold (55°C). Inspect cooling, ventilation, and heat dissipation."
    },
    "TEST_NOTIFICATION": {
        "title": "🧪 SolarGuard Alert Service: Test Notification",
        "severity": "SYSTEM TEST",
        "theme_color": "#2563eb",      # Blue
        "badge_bg": "#eff6ff",
        "badge_text": "#1e40af",
        "default_action": "Verification test email sent from SolarGuard IoT Settings. Alerts are armed and ready for the 3 critical events."
    }
}

# Cooldown tracking (in-memory, 5 minutes per problem/panel)
_last_sent_timestamps: Dict[str, float] = {}
COOLDOWN_SECONDS = 300  # 5 minutes


class SolarGuardEmailService:
    """
    Automated Email Dispatcher for SolarGuard IoT.
    Supports free emailing providers:
      1. Resend REST API (Free 100 emails/day - https://resend.com)
      2. Brevo (Sendinblue) REST API (Free 300 emails/day - https://brevo.com)
      3. Standard SMTP (Gmail App Password, Brevo SMTP, etc.)
    Stores configuration and alert logs directly in MongoDB.
    """

    def __init__(self):
        pass

    def get_recipient_email(self) -> Optional[str]:
        """Retrieves configured recipient email from MongoDB first, falling back to .env."""
        try:
            settings = db_client.get_notification_settings()
            email = settings.get("notification_email")
            if email and "@" in email:
                return email.strip()
        except Exception as e:
            logger.warning(f"Failed to read recipient email from MongoDB: {e}")

        # Fallback to environment
        env_email = os.getenv("ALERT_NOTIFICATION_EMAIL") or os.getenv("NOTIFICATION_EMAIL")
        if env_email and "@" in env_email:
            return env_email.strip()

        return None

    def build_html_template(
        self,
        problem_key: str,
        details: str,
        metrics: Optional[Dict[str, Any]] = None,
        panel_id: Optional[int] = None,
        recipient_email: str = ""
    ) -> str:
        """Generates a responsive HTML email with SolarGuard branding and problem details."""
        meta = ALLOWED_PROBLEMS.get(problem_key, ALLOWED_PROBLEMS["TEST_NOTIFICATION"])
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        panel_info = f"Panel {panel_id}" if panel_id else "Solar Array / Monitored System"

        metrics_html = ""
        if metrics:
            metrics_rows = ""
            for k, v in metrics.items():
                label = k.replace("_", " ").title()
                metrics_rows += f"""
                <tr>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; font-weight: 600;">{label}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-family: monospace; font-weight: bold;">{v}</td>
                </tr>
                """
            metrics_html = f"""
            <div style="margin-top: 16px; margin-bottom: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Telemetry Metric</th>
                            <th style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Measured Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics_rows}
                    </tbody>
                </table>
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{meta['title']}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                <!-- Header Banner -->
                <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 32px; border-bottom: 4px solid {meta['theme_color']};">
                        <table width="100%">
                            <tr>
                                <td>
                                    <span style="display: inline-block; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                        ⚡ SolarGuard <span style="color: #f59e0b; font-weight: 500;">IoT</span>
                                    </span>
                                    <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Smart Solar Monitoring &amp; Wiper Defense System</div>
                                </td>
                                <td style="text-align: right;">
                                    <span style="display: inline-block; background: {meta['badge_bg']}; color: {meta['badge_text']}; border: 1px solid {meta['theme_color']}40; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                        {meta['severity']}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Content Area -->
                <tr>
                    <td style="padding: 32px;">
                        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
                            {meta['title']}
                        </h2>

                        <div style="background: #f8fafc; border-left: 4px solid {meta['theme_color']}; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 14px; color: #334155; line-height: 1.5;">
                            <strong>Incident Description:</strong><br>
                            {details}
                        </div>

                        <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                            <strong>Target Unit:</strong> {panel_info} &bull; <strong>Timestamp:</strong> {now_str}
                        </div>

                        {metrics_html}

                        <!-- Recommended Action -->
                        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-top: 20px;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #92400e; margin-bottom: 4px;">
                                Recommended Action:
                            </div>
                            <div style="font-size: 13px; color: #78350f; line-height: 1.4;">
                                {meta['default_action']}
                            </div>
                        </div>

                        <!-- Policy Note -->
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; margin-bottom: 0; line-height: 1.4;">
                            * Notice: Per your SolarGuard configuration, email notifications are pushed exclusively for <strong>Cracks, Power Failures, and Temperature &gt; 55°C</strong>.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
                        SolarGuard IoT System &bull; MongoDB Database Connected &bull; Alert sent to <code>{recipient_email}</code>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        return html

    async def send_via_resend(self, api_key: str, recipient: str, subject: str, html_body: str) -> Dict[str, Any]:
        """Dispatches email via free Resend REST API (100 emails/day free)."""
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": "SolarGuard Alerts <onboarding@resend.dev>",
            "to": [recipient],
            "subject": subject,
            "html": html_body
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in [200, 201]:
                res_data = resp.json()
                msg_id = res_data.get("id")
                logger.info(f"[+] Alert email delivered via Resend API to {recipient}. Message ID: {msg_id}")
                return {"success": True, "provider": "resend", "data": res_data, "message_id": msg_id}
            else:
                try:
                    err_json = resp.json()
                    error_msg = err_json.get("message") or resp.text
                except Exception:
                    error_msg = resp.text
                logger.error(f"[-] Resend API error ({resp.status_code}): {error_msg}")
                return {"success": False, "provider": "resend", "error": f"HTTP {resp.status_code}: {error_msg}"}

    async def send_via_brevo(self, api_key: str, recipient: str, subject: str, html_body: str) -> Dict[str, Any]:
        """Dispatches email via free Brevo (Sendinblue) REST API (300 emails/day free)."""
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": api_key.strip(),
            "Content-Type": "application/json"
        }
        payload = {
            "sender": {"name": "SolarGuard IoT", "email": "alerts@solarguard.local"},
            "to": [{"email": recipient}],
            "subject": subject,
            "htmlContent": html_body
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in [200, 201]:
                return {"success": True, "provider": "brevo", "data": resp.json()}
            else:
                error_msg = resp.text
                logger.error(f"Brevo API error ({resp.status_code}): {error_msg}")
                return {"success": False, "provider": "brevo", "error": f"HTTP {resp.status_code}: {error_msg}"}

    def send_via_smtp(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        recipient: str,
        subject: str,
        html_body: str
    ) -> Dict[str, Any]:
        """Dispatches email via standard SMTP (e.g. Gmail App Password or Brevo SMTP)."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"SolarGuard Alerts <{username}>"
            msg["To"] = recipient

            part = MIMEText(html_body, "html")
            msg.attach(part)

            server = smtplib.SMTP(host, port, timeout=12)
            server.ehlo()
            if port in [587, 25]:
                server.starttls()
                server.ehlo()

            if username and password:
                server.login(username, password)

            server.sendmail(username, recipient, msg.as_string())
            server.quit()

            return {"success": True, "provider": "smtp"}
        except Exception as e:
            logger.error(f"SMTP error ({host}:{port}): {e}")
            return {"success": False, "provider": "smtp", "error": str(e)}

    async def dispatch_alert(
        self,
        problem_type: str,
        title: str,
        details: str,
        panel_id: Optional[int] = None,
        metrics: Optional[Dict[str, Any]] = None,
        is_test: bool = False,
        override_recipient: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for dispatching alert emails.
        STRICT POLICY: Rejects any issue that is not one of the 3 specified problems!
        """
        # 1. Enforce the 3 specific allowed problem types
        if problem_type not in ALLOWED_PROBLEMS:
            error_msg = f"Email rejected. System only sends emails for the 3 critical problems: Cracks, Power Problems, or Temp > 55°C. (Requested: '{problem_type}')"
            logger.warning(error_msg)
            return {
                "success": False,
                "reason": "DISALLOWED_PROBLEM_TYPE",
                "message": error_msg,
                "allowed_types": list(ALLOWED_PROBLEMS.keys())
            }

        # 2. Get recipient email from MongoDB or override
        recipient = override_recipient or self.get_recipient_email()
        if not recipient or "@" not in recipient:
            msg = "No alert recipient email configured. Please enter your email in Settings to receive alerts."
            logger.warning(msg)
            # Log pending alert to MongoDB anyway so audit trail is preserved
            db_client.log_email_alert({
                "problem_type": problem_type,
                "title": title,
                "details": details,
                "recipient": None,
                "status": "UNCONFIGURED_RECIPIENT",
                "metrics": metrics
            })
            return {
                "success": False,
                "reason": "NO_RECIPIENT_CONFIGURED",
                "message": msg
            }

        # 3. Anti-Spam Cooldown Check
        cooldown_key = f"{problem_type}_{panel_id or 0}_{recipient}"
        now = time.time()
        if not is_test:
            last_sent = _last_sent_timestamps.get(cooldown_key, 0)
            if now - last_sent < COOLDOWN_SECONDS:
                remaining = int(COOLDOWN_SECONDS - (now - last_sent))
                logger.info(f"Email alert '{problem_type}' suppressed by cooldown ({remaining}s remaining).")
                return {
                    "success": True,
                    "suppressed": True,
                    "reason": "COOLDOWN_ACTIVE",
                    "cooldown_remaining_sec": remaining,
                    "message": f"Alert email suppressed by 5-minute anti-spam protection ({remaining}s remaining)."
                }

        # 4. Construct Subject & HTML
        meta = ALLOWED_PROBLEMS[problem_type]
        subject = f"{meta['severity']}: {title}"
        html_body = self.build_html_template(
            problem_key=problem_type,
            details=details,
            metrics=metrics,
            panel_id=panel_id,
            recipient_email=recipient
        )

        # 5. Fetch Provider Credentials from MongoDB or .env
        settings = db_client.get_notification_settings()
        resend_key = settings.get("resend_api_key") or os.getenv("RESEND_API_KEY")
        brevo_key = settings.get("brevo_api_key") or os.getenv("BREVO_API_KEY")

        smtp_host = settings.get("smtp_host") or os.getenv("SMTP_HOST")
        smtp_port = int(settings.get("smtp_port") or os.getenv("SMTP_PORT", "587"))
        smtp_user = settings.get("smtp_user") or os.getenv("SMTP_USER")
        smtp_pass = settings.get("smtp_pass") or os.getenv("SMTP_PASS") or os.getenv("SMTP_PASSWORD")

        delivery_result = None

        # Try Resend API first if configured
        if resend_key:
            logger.info(f"Attempting email dispatch via Resend to {recipient}...")
            delivery_result = await self.send_via_resend(resend_key, recipient, subject, html_body)

        # Try Brevo API second
        elif brevo_key:
            logger.info(f"Attempting email dispatch via Brevo to {recipient}...")
            delivery_result = await self.send_via_brevo(brevo_key, recipient, subject, html_body)

        # Try SMTP third
        elif smtp_host and smtp_user and smtp_pass:
            logger.info(f"Attempting email dispatch via SMTP ({smtp_host}:{smtp_port}) to {recipient}...")
            delivery_result = self.send_via_smtp(
                host=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
                recipient=recipient,
                subject=subject,
                html_body=html_body
            )

        # Standalone / Simulated Mode (No API key yet, but user configured their email)
        else:
            logger.info(f"[SIMULATED EMAIL DISPATCH] Recipient: {recipient} | Subject: {subject}")
            logger.info(f"  --> Details: {details}")
            delivery_result = {
                "success": True,
                "provider": "mongodb_preview",
                "simulated": True,
                "message": f"Alert recorded in MongoDB for {recipient}. (To deliver to inbox, add free Resend API key or Gmail App Password in Settings)."
            }

        # 6. Record timestamp if successful
        if delivery_result and delivery_result.get("success"):
            _last_sent_timestamps[cooldown_key] = now

        # 7. Audit log into MongoDB
        log_entry = {
            "problem_type": problem_type,
            "title": title,
            "details": details,
            "panel_id": panel_id,
            "recipient": recipient,
            "success": delivery_result.get("success", False) if delivery_result else False,
            "provider": delivery_result.get("provider", "unknown") if delivery_result else "error",
            "error": delivery_result.get("error") if delivery_result else "No result",
            "is_test": is_test,
            "metrics": metrics
        }
        db_client.log_email_alert(log_entry)

        return {
            "success": delivery_result.get("success", False) if delivery_result else False,
            "recipient": recipient,
            "problem_type": problem_type,
            "provider": delivery_result.get("provider") if delivery_result else "error",
            "simulated": delivery_result.get("simulated", False) if delivery_result else False,
            "message": delivery_result.get("message") or ("Email delivered successfully." if delivery_result.get("success") else delivery_result.get("error")),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global singleton service instance
email_service = SolarGuardEmailService()
