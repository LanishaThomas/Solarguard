import json
import logging
import ssl
import time
import asyncio
from typing import Optional
import paho.mqtt.client as mqtt

from ..config import (
    EMQX_BROKER,
    EMQX_PORT,
    EMQX_USERNAME,
    EMQX_PASSWORD,
    EMQX_TOPIC_PREFIX,
)
from .email_service import email_service

logger = logging.getLogger("solarguard.mqtt")

class SolarGuardMqttSubscriber:
    """
    Background MQTT listener for the FastAPI backend.
    Subscribes to 'solarguard/alerts' so that whenever the ESP32 (or a hardware fault)
    publishes a critical alert, an email is dispatched directly from the server
    WITHOUT requiring a browser window or frontend client to be open.
    """

    def __init__(self):
        self.client: Optional[mqtt.Client] = None
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.is_connected: bool = False
        self._last_processed_ts: dict[str, float] = {}

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        rc_code = getattr(rc, "value", rc)
        if rc_code == 0 or str(rc) == "Success":
            self.is_connected = True
            logger.info(f"Connected to EMQX Broker ({EMQX_BROKER}:{EMQX_PORT}). Subscribing to alert topics...")
            topic_alerts = f"{EMQX_TOPIC_PREFIX}/alerts"
            topic_temp = f"{EMQX_TOPIC_PREFIX}/temperature/alert"
            client.subscribe([(topic_alerts, 1), (topic_temp, 1)])
            logger.info(f"Subscribed to [{topic_alerts}, {topic_temp}]")
        else:
            self.is_connected = False
            logger.warning(f"Failed to connect to EMQX broker. Return code: {rc}")

    def _on_disconnect(self, client, userdata, flags, rc, properties=None):
        self.is_connected = False
        logger.warning(f"Disconnected from EMQX broker (rc: {rc}). Client will auto-reconnect.")

    def _on_message(self, client, userdata, msg):
        try:
            raw_payload = msg.payload.decode("utf-8")
            payload = json.loads(raw_payload)
            topic = msg.topic
            alert_type = payload.get("type", "").strip()

            logger.info(f"[MQTT ALERT RX -> {topic}] Type='{alert_type}', Title='{payload.get('title')}'")

            # Map incoming MQTT alert types to allowed email problems
            problem_type = None
            if alert_type == "PANEL_DISCONNECTED":
                problem_type = "PANEL_DISCONNECTED"
            elif alert_type == "PEER_UNDERPERFORMANCE":
                problem_type = "POWER_UNDERPERFORMANCE"
            elif alert_type in ("HIGH_TEMPERATURE", "CRITICAL_TEMPERATURE"):
                problem_type = "HIGH_TEMPERATURE"
            elif alert_type == "CRACK_DETECTED":
                problem_type = "CRACK_DETECTED"

            if not problem_type:
                logger.debug(f"Ignoring non-critical or informational alert type: '{alert_type}'")
                return

            panel_id = payload.get("panel_id")
            title = payload.get("title") or f"Alert: {problem_type}"
            message = payload.get("message") or f"Solar array flagged {problem_type} event."

            # Construct metrics dictionary for email template
            metrics = {
                "source": "ESP32 Firmware Direct via EMQX",
                "topic": topic,
                "timestamp_ms": payload.get("timestamp_ms"),
            }
            if panel_id is not None:
                metrics["affected_panel"] = f"Panel {panel_id}"
            if problem_type == "PANEL_DISCONNECTED":
                metrics["measured_voltage"] = "0.00V (Physical Disconnect / Open-Circuit)"
                metrics["measured_current"] = "0.00A"
            elif problem_type == "HIGH_TEMPERATURE":
                metrics["temperature"] = f"{payload.get('temperature', 55.0)}°C"

            # Dispatch via async loop in thread-safe manner
            if self.loop and self.loop.is_running():
                logger.info(f"Dispatching critical email alert for problem '{problem_type}' (Panel {panel_id})...")
                asyncio.run_coroutine_threadsafe(
                    email_service.dispatch_alert(
                        problem_type=problem_type,
                        title=title,
                        details=message,
                        panel_id=panel_id,
                        metrics=metrics
                    ),
                    self.loop
                )
            else:
                logger.warning("Event loop not available to dispatch email alert.")

        except Exception as e:
            logger.error(f"Error handling incoming MQTT alert message: {e}", exc_info=True)

    def start(self, loop: asyncio.AbstractEventLoop):
        """Starts the background MQTT listener thread."""
        self.loop = loop
        try:
            client_id = f"solarguard-backend-{int(time.time())}"
            self.client = mqtt.Client(
                mqtt.CallbackAPIVersion.VERSION2,
                client_id=client_id
            )
            if EMQX_USERNAME and EMQX_PASSWORD:
                self.client.username_pw_set(EMQX_USERNAME, EMQX_PASSWORD)

            # EMQX Cloud uses standard TLS
            self.client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message

            logger.info(f"Connecting background MQTT listener to {EMQX_BROKER}:{EMQX_PORT}...")
            self.client.connect_async(EMQX_BROKER, EMQX_PORT, keepalive=60)
            self.client.loop_start()
            logger.info("SolarGuard MQTT subscriber background loop started.")
        except Exception as e:
            logger.error(f"Failed to start SolarGuard MQTT subscriber: {e}", exc_info=True)

    def stop(self):
        """Stops the background MQTT listener thread."""
        if self.client:
            try:
                self.client.loop_stop()
                self.client.disconnect()
                logger.info("SolarGuard MQTT subscriber stopped.")
            except Exception as e:
                logger.warning(f"Error stopping MQTT client: {e}")
            finally:
                self.client = None
                self.is_connected = False

mqtt_subscriber = SolarGuardMqttSubscriber()

