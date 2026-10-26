# SolarGuard IoT — ESP32 Smart Wiper & Temperature Subsystem

This folder contains the complete, production-ready Arduino firmware for the **SolarGuard ESP32 Wiper Subsystem** using **EMQX Cloud MQTT**.

---

## 1. Hardware Pinout Reference

This firmware strictly adheres to your exact breadboard pinout:

| ESP32 Pin | Connection / Hardware Component | Notes |
|:---|:---|:---|
| **3V3** | **Breadboard Positive Rail for Sensors** | Powers the DS18B20 temperature sensor VDD line |
| **GND** | **Breadboard Ground Rail** | **COMMON GROUND** — Must connect ESP32 GND, breadboard rail, and external 5V servo supply GND |
| **GPIO 21** | **Shared SDA Line** | I2C Data line (`Wire.begin(21, 22)`) |
| **GPIO 22** | **Shared SCL Line** | I2C Clock line |
| **GPIO 4** | **DS18B20 DATA** | 1-Wire temperature data line (**requires a 4.7 kΩ pull-up resistor** between GPIO 4 and 3V3) |
| **GPIO 18** | **SG90 Signal** | PWM pulse signal line (Orange/Yellow wire on SG90 servo) |

### ⚠️ Critical Power Safety Rule for the SG90 Servo:
- **DO NOT connect the SG90 Red wire (V+) to the ESP32 3.3V pin.** The SG90 draws 350mA–650mA during movement/stall, which will burn out the ESP32's 3.3V voltage regulator or cause immediate brownout resets (`Brownout detector was triggered`).
- **Power the SG90 from a regulated 5V source** (e.g. an external 5V USB breakout, a 5V 1A/2A DC power supply, or the ESP32's `VIN`/`5V` pin when plugged into a 5V 2A USB charger).
- **Tie all grounds together:** The negative (GND) wire from the 5V power supply must connect directly to the ESP32 breadboard GND rail.

---

## 2. Required Arduino Libraries

Open the **Arduino IDE**, navigate to **Tools** ➔ **Manage Libraries...** (or press `Ctrl + Shift + I`), and install:

1. **`ESP32Servo`** (by Kevin Harrington, John K. Bennett) — Provides hardware timer PWM control for servos on ESP32 without conflicts.
2. **`PubSubClient`** (by Nick O'Leary) — Lightweight MQTT client library.
3. **`OneWire`** (by Paul Stoffregen) — 1-Wire communication protocol for DS18B20.
4. **`DallasTemperature`** (by Miles Burton) — Temperature reading routines for DS18B20.
5. **`ArduinoJson`** (by Benoit Blanchon, v6 or v7) — Fast JSON serialization and deserialization.

---

## 3. EMQX Cloud MQTT Broker Setup

The firmware and web application are configured for your **EMQX Cloud Serverless Deployment**:

- **Broker Address:** `v20f2113.ala.asia-southeast1.emqxsl.com`
- **ESP32 Firmware Port (MQTT over TLS/SSL):** `8883`
- **React Web App Port (WebSocket over TLS/SSL):** `8084`
- **WebSocket Path:** `/mqtt`

### Step 1: Create MQTT Credentials in EMQX Cloud
1. In your EMQX Cloud console, open your project **Solarguard**.
2. Click **Access Control** ➔ **Authentication** from the left navigation menu.
3. Click **+ Add** to create an MQTT Username and Password (e.g. `solarguard_esp32` / `solarguard_secret`).

### Step 2: Configure ESP32 Firmware
In `firmware/solarguard_esp32_wiper.ino`:
```cpp
const char* MQTT_BROKER   = "v20f2113.ala.asia-southeast1.emqxsl.com";
const int   MQTT_PORT     = 8883;
const char* MQTT_USER     = "your_emqx_username";
const char* MQTT_PASSWORD = "your_emqx_password";
```

### Step 3: Configure Web App
In `.env` or in the SolarGuard Web App **Settings** page:
- **Broker Host:** `v20f2113.ala.asia-southeast1.emqxsl.com`
- **WebSocket Port:** `8084`
- **Username:** `your_emqx_username`
- **Password:** `your_emqx_password`

---

## 4. MQTT Topic Architecture

| Topic | Direction | Payload Example | Purpose |
|:---|:---|:---|:---|
| `solarguard/wiper/command` | **App ➔ ESP32** | `{"command": "WIPE"}` or `"WIPE"` | Triggers a smooth forward & backward cleaning sweep |
| `solarguard/wiper/command` | **App ➔ ESP32** | `{"command": "STOP"}` or `"STOP"` | **Emergency Cut-Off:** Instantly halts servo and cuts PWM power |
| `solarguard/wiper/command` | **App ➔ ESP32** | `{"command": "RESET"}` | Clears fault / cooldown and restores standby |
| `solarguard/wiper/status` | **ESP32 ➔ App** | `{"state": "WIPING", "progress": 40}` | Real-time actuation progress (0%–100%) |
| `solarguard/telemetry` | **ESP32 ➔ App** | `{"temperature": 28.5, "sensor_connected": true, "wiper_state": "IDLE"}` | Live DS18B20 temperature telemetry every 3s |
| `solarguard/status` | **ESP32 ➔ App** | `{"online": true, "ip": "192.168.1.100"}` | Device heartbeat and MQTT Last Will & Testament (LWT) |

---

## 5. Wiper Protection & Actuator Safety Features

1. **Non-blocking State Machine:**
   Unlike simple code with `delay(2000)`, the ESP32 steps the servo every 12ms while continuously checking MQTT. An incoming `STOP` (Emergency Stop) command cuts motor power in under 15ms.
2. **Automatic Servo Detach:**
   When the wiper is parked at the home position (10°) or in cooldown, `wiperServo.detach()` is called. This removes the PWM drive signal so the SG90 doesn't jitter, buzz, overheat, or drain standby power.
3. **Mandatory 45s Cooldown:**
   Protects the delicate internal plastic gears and small DC motor of the SG90 actuator from thermal degradation.
4. **End-Stop Cushioning:**
   The sweep boundaries are configured to 10° – 170° rather than 0° – 180° to avoid slamming into the physical stops inside the servo casing.
