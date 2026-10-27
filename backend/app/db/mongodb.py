import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError, ConnectionFailure
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

logger = logging.getLogger("solarguard.db")

class MongoDBClient:
    """
    MongoDB Connection Manager for SolarGuard IoT.
    Connects to MongoDB directly in backend code using MONGODB_URI from .env.
    Collections:
      - telemetry_readings
      - camera_inspections
      - cleaning_logs
      - system_alerts
    """
    def __init__(self):
        self.client: Optional[Any] = None
        self.db = None
        self.uri: Optional[str] = None
        self.db_name: str = "solarguard_db"
        self.is_connected: bool = False
        self.connection_error: Optional[str] = None

    def connect(self) -> bool:
        try:
            from dotenv import load_dotenv
            load_dotenv()
            from pathlib import Path
            load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
        except Exception:
            pass

        self.uri = os.getenv("MONGODB_URI")
        self.db_name = os.getenv("MONGODB_DB_NAME", "solarguard_db")

        if not self.uri:
            self.connection_error = "MONGODB_URI not set in environment or .env file."
            self.is_connected = False
            logger.info("MongoDB: MONGODB_URI not configured in .env. Running in standalone mode.")
            return False

        if not PYMONGO_AVAILABLE:
            self.connection_error = "pymongo package is not installed."
            self.is_connected = False
            logger.warning("MongoDB: pymongo driver missing.")
            return False

        try:
            logger.info(f"Connecting to MongoDB database: '{self.db_name}'...")
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=3500)
            # Ping database to verify connection
            self.client.admin.command("ping")
            self.db = self.client[self.db_name]
            self.is_connected = True
            self.connection_error = None
            logger.info(f"[+] MongoDB connected successfully to database: '{self.db_name}'")
            return True
        except Exception as e:
            self.connection_error = str(e)
            self.is_connected = False
            logger.warning(f"MongoDB connection failed: {e}")
            return False

    def close(self):
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass
            self.is_connected = False
            logger.info("MongoDB connection closed.")

    def log_inspection(self, inspection_data: Dict[str, Any]) -> bool:
        if not self.is_connected or self.db is None:
            return False
        try:
            doc = dict(inspection_data)
            doc["created_at"] = datetime.now(timezone.utc)
            self.db.camera_inspections.insert_one(doc)
            return True
        except Exception as e:
            logger.error(f"Error logging inspection to MongoDB: {e}")
            return False

    def log_telemetry(self, telemetry_data: Dict[str, Any]) -> bool:
        if not self.is_connected or self.db is None:
            return False
        try:
            doc = dict(telemetry_data)
            doc["created_at"] = datetime.now(timezone.utc)
            self.db.telemetry_readings.insert_one(doc)
            return True
        except Exception as e:
            logger.error(f"Error logging telemetry to MongoDB: {e}")
            return False

    def log_cleaning(self, cleaning_data: Dict[str, Any]) -> bool:
        if not self.is_connected or self.db is None:
            return False
        try:
            doc = dict(cleaning_data)
            doc["created_at"] = datetime.now(timezone.utc)
            self.db.cleaning_logs.insert_one(doc)
            return True
        except Exception as e:
            logger.error(f"Error logging cleaning to MongoDB: {e}")
            return False

    def get_notification_settings(self) -> Dict[str, Any]:
        """Retrieves stored alert notification settings (recipient email & configuration) from MongoDB."""
        if not self.is_connected:
            self.connect()
        if not self.is_connected or self.db is None:
            return {
                "notification_email": "",
                "provider": "smtp",
                "is_enabled": False,
                "stored_in_db": False
            }
        try:
            doc = self.db.system_settings.find_one({"key": "notification_settings"})
            if doc:
                doc.pop("_id", None)
                doc["stored_in_db"] = True
                return doc
            return {
                "notification_email": "",
                "provider": "smtp",
                "is_enabled": False,
                "stored_in_db": True
            }
        except Exception as e:
            logger.error(f"Error fetching notification settings from MongoDB: {e}")
            return {
                "notification_email": "",
                "provider": "smtp",
                "is_enabled": False,
                "error": str(e),
                "stored_in_db": False
            }

    def save_notification_settings(self, settings_data: Dict[str, Any]) -> bool:
        """Saves or updates alert notification settings in MongoDB."""
        if not self.is_connected:
            self.connect()
        if not self.is_connected or self.db is None:
            return False
        try:
            doc = dict(settings_data)
            doc["key"] = "notification_settings"
            doc["updated_at"] = datetime.now(timezone.utc)
            self.db.system_settings.update_one(
                {"key": "notification_settings"},
                {"$set": doc},
                upsert=True
            )
            logger.info(f"Notification settings saved to MongoDB for recipient: {doc.get('notification_email')}")
            return True
        except Exception as e:
            logger.error(f"Error saving notification settings to MongoDB: {e}")
            return False

    def log_email_alert(self, alert_data: Dict[str, Any]) -> bool:
        """Logs dispatched email alerts to MongoDB for full audit history."""
        if not self.is_connected:
            self.connect()
        if not self.is_connected or self.db is None:
            return False
        try:
            doc = dict(alert_data)
            doc["created_at"] = datetime.now(timezone.utc)
            self.db.email_alerts.insert_one(doc)
            return True
        except Exception as e:
            logger.error(f"Error logging email alert to MongoDB: {e}")
            return False

    def get_recent_email_alerts(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Fetches recent email alerts from MongoDB."""
        if not self.is_connected or self.db is None:
            return []
        try:
            cursor = self.db.email_alerts.find().sort("created_at", -1).limit(limit)
            alerts = []
            for doc in cursor:
                doc.pop("_id", None)
                if isinstance(doc.get("created_at"), datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                alerts.append(doc)
            return alerts
        except Exception as e:
            logger.error(f"Error reading email alerts from MongoDB: {e}")
            return []

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_connected": self.is_connected,
            "database": self.db_name if self.is_connected else None,
            "configured": bool(self.uri),
            "error": self.connection_error,
            "instructions": "Add MONGODB_URI to your .env file to enable persistence."
        }

db_client = MongoDBClient()
