import ssl
import time
import json
import sys
import argparse
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import paho.mqtt.client as mqtt

from backend.app.config import (
    EMQX_BROKER,
    EMQX_PORT,
    EMQX_USERNAME,
    EMQX_PASSWORD,
    EMQX_TOPIC_PREFIX
)

def create_telemetry_payload(scenario="disconnect", cycle=1):
    """
    Generates realistic telemetry frames matching solarguard_esp32_wiper.ino.
    Scenarios:
      - 'disconnect': Panel 2 is 0.00V, 0.00A (Physical Disconnect / Open Circuit)
      - 'shade': Panel 2 is shaded (low voltage 0.35V, low current ~0.0003A)
      - 'normal': All 3 panels healthy (~0.86V, ~15mA)
      - 'heat': Array temperature exceeds 58°C
    """
    temp_c = 58.5 if scenario == "heat" else 28.4

    if scenario == "disconnect":
        p2_voltage = 0.000
        p2_current = 0.0000
        p2_power = 0.0000
        p2_shunt = 0.00
        p2_status = "offline"
        p2_flag = "DISCONNECTED"
        p2_trend = "down"
        p2_eff = 0
        p2_dev = -100.0
    elif scenario == "shade":
        p2_voltage = 0.350
        p2_current = 0.0003
        p2_power = 0.0001
        p2_shunt = 0.03
        p2_status = "degraded"
        p2_flag = "UNDERPERFORMING"
        p2_trend = "down"
        p2_eff = 12
        p2_dev = -98.5
    else: # normal or heat
        p2_voltage = 0.864
        p2_current = 0.0150
        p2_power = 0.0130
        p2_shunt = 1.50
        p2_status = "healthy"
        p2_flag = "HEALTHY"
        p2_trend = "stable"
        p2_eff = 98
        p2_dev = 0.0

    p1_power = 0.0130
    p3_power = 0.0121
    total_power = round(p1_power + p2_power + p3_power, 4)
    median_power = p2_power if scenario in ("disconnect", "shade") else 0.0125

    return {
        "temperature": temp_c,
        "temperature_c": temp_c,
        "sensor_connected": True,
        "total_power": total_power,
        "median_power": median_power,
        "peak_panel_id": 1,
        "panels": [
            {
                "id": 1,
                "name": "Panel 1 (Alpha)",
                "channel": "CH0 (0x40)",
                "i2c_address": "0x40",
                "voltage_v": 0.864,
                "current_a": 0.0150,
                "power_w": p1_power,
                "shunt_mv": 1.50,
                "status": "healthy",
                "flag": "HEALTHY",
                "trend": "stable",
                "efficiency_pct": 98,
                "deviation_pct": 0.0,
                "temperature_c": temp_c
            },
            {
                "id": 2,
                "name": "Panel 2 (Beta)",
                "channel": "CH1 (0x41)",
                "i2c_address": "0x41",
                "voltage_v": p2_voltage,
                "current_a": p2_current,
                "power_w": p2_power,
                "shunt_mv": p2_shunt,
                "status": p2_status,
                "flag": p2_flag,
                "trend": p2_trend,
                "efficiency_pct": p2_eff,
                "deviation_pct": p2_dev,
                "temperature_c": temp_c
            },
            {
                "id": 3,
                "name": "Panel 3 (Gamma)",
                "channel": "CH2 (0x44)",
                "i2c_address": "0x44",
                "voltage_v": 0.832,
                "current_a": 0.0145,
                "power_w": p3_power,
                "shunt_mv": 1.45,
                "status": "healthy",
                "flag": "HEALTHY",
                "trend": "stable",
                "efficiency_pct": 95,
                "deviation_pct": -6.9,
                "temperature_c": temp_c
            }
        ],
        "flags": {
            "high_temp": (scenario == "heat"),
            "critical_temp": (scenario == "heat"),
            "temp_sensor_fault": False,
            "underperforming": scenario in ("disconnect", "shade"),
            "underperforming_count": 1 if scenario in ("disconnect", "shade") else 0,
            "low_ambient_light": False,
            "sensor_fault": (scenario == "disconnect"),
            "cleaning_recommended": (scenario == "shade"),
            "alert_cooldown_remaining_sec": 0,
            "alert_cooldown_duration_sec": 10
        },
        "wiper_state": "IDLE",
        "uptime_sec": int(time.time()),
        "rssi": -52,
        "ip": "192.168.1.150"
    }

def main():
    parser = argparse.ArgumentParser(description="SolarGuard Live MQTT Test Feeder")
    parser.add_argument("--scenario", choices=["disconnect", "shade", "normal", "heat"], default="disconnect", help="Simulation scenario")
    parser.add_argument("--cycles", type=int, default=10, help="Number of telemetry cycles (default 10, or -1 for infinite)")
    parser.add_argument("--interval", type=float, default=2.5, help="Seconds between telemetry frames (default 2.5s)")
    args = parser.parse_args()

    print(f"[SolarGuard Feeder] Connecting to {EMQX_BROKER}:{EMQX_PORT}...")
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"solarguard-test-data-{int(time.time())}")
    client.username_pw_set(EMQX_USERNAME, EMQX_PASSWORD)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.connect(EMQX_BROKER, EMQX_PORT, 60)
    client.loop_start()
    time.sleep(1)

    prefix = EMQX_TOPIC_PREFIX or "solarguard"

    # 1. Status / Heartbeat
    status_payload = {
        "online": True,
        "ip": "192.168.1.150",
        "firmware_version": "1.0.0",
        "device": "ESP32-WROOM-32",
        "rssi": -52
    }
    client.publish(f"{prefix}/status", json.dumps(status_payload), qos=1)

    # 2. Alert message if scenario requires it
    if args.scenario == "disconnect":
        alert_payload = {
            "type": "PANEL_DISCONNECTED",
            "severity": "critical",
            "panel_id": 2,
            "title": "Panel 2 Disconnected",
            "message": "Panel 2 is physically disconnected or open-circuit (0.00V, 0.00A).",
            "recommendedAction": "Check solar panel wiring and INA219 connections immediately.",
            "cooldown_sec": 10,
            "timestamp_ms": int(time.time() * 1000)
        }
        print(f"[Alert] Dispatched -> {prefix}/alerts: {alert_payload['title']}")
        client.publish(f"{prefix}/alerts", json.dumps(alert_payload), qos=1)
    elif args.scenario == "shade":
        alert_payload = {
            "type": "PEER_UNDERPERFORMANCE",
            "severity": "warning",
            "panel_id": 2,
            "title": "Panel 2 Underperforming Peers",
            "message": "Panel 2 power (0.0001W) is below peer baseline (0.0125W).",
            "recommendedAction": "Inspect Panel 2 for shading, debris, or soiling.",
            "cooldown_sec": 10,
            "timestamp_ms": int(time.time() * 1000)
        }
        print(f"[Alert] Dispatched -> {prefix}/alerts: {alert_payload['title']}")
        client.publish(f"{prefix}/alerts", json.dumps(alert_payload), qos=1)
    elif args.scenario == "heat":
        alert_payload = {
            "type": "HIGH_TEMPERATURE",
            "severity": "critical",
            "temperature": 58.5,
            "title": "Thermal Limit Exceeded: Panel Temp > 55°C",
            "message": "Surface heat is 58.5°C, exceeding safe threshold.",
            "cooldown_sec": 10,
            "timestamp_ms": int(time.time() * 1000)
        }
        print(f"[Alert] Dispatched -> {prefix}/alerts: {alert_payload['title']}")
        client.publish(f"{prefix}/alerts", json.dumps(alert_payload), qos=1)

    # 3. Stream Telemetry frames
    cycle = 0
    try:
        while True:
            cycle += 1
            telemetry = create_telemetry_payload(args.scenario, cycle)
            p2 = telemetry["panels"][1]
            print(f"[Cycle {cycle}] Telemetry -> {prefix}/telemetry | P2: {p2['voltage_v']}V, {p2['current_a']}A, {p2['power_w']}W [{p2['flag']}] | Temp: {telemetry['temperature_c']}°C")
            client.publish(f"{prefix}/telemetry", json.dumps(telemetry), qos=1)

            temp_payload = {"temperature_c": telemetry["temperature_c"], "unit": "C"}
            client.publish(f"{prefix}/temperature", json.dumps(temp_payload), qos=1)

            if args.cycles > 0 and cycle >= args.cycles:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStreaming paused by user.")

    time.sleep(1)
    client.loop_stop()
    client.disconnect()
    print("[SolarGuard Feeder] Transmission complete!")

if __name__ == "__main__":
    main()
