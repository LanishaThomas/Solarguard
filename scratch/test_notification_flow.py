import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.db.mongodb import db_client
from backend.app.services.email_service import email_service, ALLOWED_PROBLEMS

def test_full_flow():
    print("[1] Connecting to MongoDB...")
    connected = db_client.connect()
    print(f"MongoDB connection status: {connected}")
    
    print("\n[2] Testing saving recipient email to MongoDB...")
    test_email = "test_alerts@solarguard.local"
    save_result = db_client.save_notification_settings({
        "notification_email": test_email,
        "is_enabled": True,
        "provider": "preview_mode"
    })
    print(f"Saved notification settings: {save_result}")
    
    print("\n[3] Testing retrieving recipient email from MongoDB...")
    retrieved = db_client.get_notification_settings()
    print(f"Retrieved settings from MongoDB: {retrieved}")
    assert retrieved.get("notification_email") == test_email, "Email mismatch!"
    
    print("\n[4] Testing the 3 allowed problem types...")
import asyncio

async def run_async_tests():
    print("\n[4] Testing the 3 allowed problem types...")
    print(f"Allowed problem types enforced by email_service: {list(ALLOWED_PROBLEMS.keys())}")
    
    # 1. Crack detected
    crack_alert = await email_service.dispatch_alert(
        problem_type="CRACK_DETECTED",
        title="Surface Crack Detected on Panel #2",
        details="AI Computer Vision identified fracture lines across silicon matrix.",
        panel_id=2,
        metrics={"confidence": "94.6%", "severity": "CRITICAL", "class": "crack"}
    )
    print(f"Crack Alert dispatched: {crack_alert['success']}, Result: {crack_alert.get('provider')}")
    
    # 2. Power underperformance
    power_alert = await email_service.dispatch_alert(
        problem_type="POWER_UNDERPERFORMANCE",
        title="Panel #1 Underperforming Peer Output",
        details="Current generation is 65% below peer baseline panels.",
        panel_id=1,
        metrics={"current_p1": "0.0012A", "peer_avg_current": "0.0085A", "deficit": "85.8%"}
    )
    print(f"Power Problem Alert dispatched: {power_alert['success']}, Result: {power_alert.get('provider')}")
    
    # 3. High temperature (> 55°C)
    temp_alert = await email_service.dispatch_alert(
        problem_type="HIGH_TEMPERATURE",
        title="Thermal Hazard: Array Exceeded Safe Limit of 55°C",
        details="Array thermistor reached 58.4°C exceeding safe operating limit of 55.0°C.",
        panel_id=None,
        metrics={"temperature": "58.4°C", "safe_limit": "55.0°C", "hazard_level": "WARNING"}
    )
    print(f"Temperature Alert dispatched: {temp_alert['success']}, Result: {temp_alert.get('provider')}")
    
    # 4. Verify rejection of unauthorized problem types
    invalid_alert = await email_service.dispatch_alert(
        problem_type="ROUTINE_WIPER_SWEEP",
        title="Wiper Swept",
        details="Routine cleaning completed."
    )
    print(f"Disallowed Problem Rejected Properly: {not invalid_alert['success']}, Reason: {invalid_alert.get('reason')}")
    assert not invalid_alert["success"], "Unauthorized problem type should be blocked!"

    print("\n[5] Fetching recent alert logs from MongoDB...")
    recent = db_client.get_recent_email_alerts(limit=5)
    print(f"Found {len(recent)} alerts logged to MongoDB: {[a.get('problem_type') for a in recent]}")
    
    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

def test_full_flow():
    print("[1] Connecting to MongoDB...")
    connected = db_client.connect()
    print(f"MongoDB connection status: {connected}")
    
    print("\n[2] Testing saving recipient email to MongoDB...")
    test_email = "test_alerts@solarguard.local"
    save_result = db_client.save_notification_settings({
        "notification_email": test_email,
        "is_enabled": True,
        "provider": "preview_mode"
    })
    print(f"Saved notification settings: {save_result}")
    
    print("\n[3] Testing retrieving recipient email from MongoDB...")
    retrieved = db_client.get_notification_settings()
    print(f"Retrieved settings from MongoDB: {retrieved}")
    assert retrieved.get("notification_email") == test_email, "Email mismatch!"
    
    asyncio.run(run_async_tests())

if __name__ == "__main__":
    test_full_flow()
