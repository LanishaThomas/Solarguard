# SolarGuard IoT — ESP32 Smart Monitoring, Sensing & Wiper Firmware

This folder contains the complete, production-ready Arduino firmware for the **SolarGuard ESP32 Subsystem** featuring **3-Channel INA219 Electricity Measuring**, **DS18B20 Temperature Detection**, **Peer Underperformance & Thermal Flagging**, and **SG90 Wiper Actuation** via **EMQX Cloud MQTT**.

---

## 1. Hardware Pinout & Wiring Reference

This firmware strictly adheres to your exact breadboard pinout:

| ESP32 Pin | Connection / Hardware Component | Purpose |
|:---|:---|:---|
| **3V3** | **VCC of all 3 INA219 modules + DS18B20 VDD** | Regulated 3.3V sensor logic power rail |
| **GND** | **Common Ground Rail** | **COMMON GROUND** — Connects ESP32 GND, breadboard ground rail, and external 5V servo supply GND |
| **GPIO 21** | **Shared SDA Line** | I2C Data line for all 3 INA219 modules (`Wire.begin(21, 22)`) |
| **GPIO 22** | **Shared SCL Line** | I2C Clock line for all 3 INA219 modules |
| **GPIO 4** | **DS18B20 DATA** | 1-Wire temperature data line (**requires a 4.7 kΩ pull-up resistor** between GPIO 4 and 3V3) |
| **GPIO 18** | **SG90 Signal Wire** | PWM pulse signal line (Orange/Yellow wire on SG90 servo) |
| **USB Port** | **Power ESP32** | Powers the ESP32 microcontroller during development |

---

## 2. INA219 Hardware Modes & Addressing (Choose One)

Standard INA219 modules ship with the exact same factory I2C address (`0x40`). If all 3 modules are tied in parallel to GPIO 21 & 22 with address `0x40`, the ESP32 cannot distinguish which panel is generating power, causing all readings to report on Panel 1.

The firmware supports **three modes**:

### Mode 1: Solder Jumper (Permanent 3-Channel Hardware — Recommended)
All modules remain on GPIO 21 (SDA) and GPIO 22 (SCL):
- **Module 1 (Panel 1):** Leave pads unsoldered ➔ Address `0x40`
- **Module 2 (Panel 2):** Solder bridge the **A0** pads ➔ Address `0x41`
- **Module 3 (Panel 3):** Solder bridge the **A1** pads ➔ Address `0x44`

### Mode 2: Multi-Pin Jumper Wiring (No Soldering Iron Needed!)
Keep all modules at address `0x40`. Give each module dedicated ESP32 GPIO pins:
- **Module 1 (Panel 1):** SDA ➔ **GPIO 21**, SCL ➔ **GPIO 22**
- **Module 2 (Panel 2):** SDA ➔ **GPIO 19**, SCL ➔ **GPIO 23**
- **Module 3 (Panel 3):** SDA ➔ **GPIO 25**, SCL ➔ **GPIO 26**
*(VCC 3.3V and GND still connect to the common breadboard power rails)*

### Mode 3: Single-Sensor Bench-Test Mode (Automatic Fallback)
If only 1 INA219 is detected at `0x40` on GPIO 21 & 22, the firmware automatically engages **Bench-Test Mode**:
- Panel 1 reads your genuine physical INA219 sensor (responds in real time to your mobile flashlight).
- Panels 2 & 3 run virtual baseline peers (`0.045V`, `0.000W`).
- Suppresses the `SENSOR_FAULT` alert and immediately enables testing of:
  - Peer underperformance alerting (>50% drop between illuminated and unilluminated panels)
  - The 10-second alert cooldown timer
  - Wiper cleaning recommendations on the dashboard

*On boot, the firmware automatically scans all buses, detects the active mode, and prints a diagnostic report in the Serial Monitor.*

---

## 3. Required Arduino Libraries

Open the **Arduino IDE**, navigate to **Tools** ➔ **Manage Libraries...** (or press `Ctrl + Shift + I`), and install:

1. **`Adafruit INA219`** (by Adafruit) — High-precision voltage, shunt current, and power measurement.
2. **`OneWire`** (by Paul Stoffregen) — 1-Wire communication protocol for DS18B20.
3. **`DallasTemperature`** (by Miles Burton) — Temperature reading routines for DS18B20.
4. **`ESP32Servo`** (by Kevin Harrington, John K. Bennett) — Hardware timer PWM servo control.
5. **`PubSubClient`** (by Nick O'Leary) — Lightweight MQTT client library.

---

## 4. Key Subsystem Features

### ⚡ 1. Electricity Measuring
- **Bus Voltage ($V$):** High-precision digital voltage sensing for each solar panel.
- **Current ($A$) & Shunt Voltage ($mV$):** Calibrated for 0.1 Ω (R100) shunt resistors up to ±3.2 A with 0.1 mA resolution.
- **Power ($W$):** Real-time calculated electrical wattage ($P = V \times I$).
- **Total Power & Median Power:** Aggregated 3-panel metrics for performance baselining.

### 🌡️ 2. Temperature Detection
- **DS18B20 1-Wire Probe on GPIO 4:** Continuous solar panel thermal monitoring every 2.5 seconds.
- **Automatic Disconnection Detection:** Prevents false alarms on disconnected probes (-127°C / 85°C filter).
- **Dual Thermal Safety Thresholds:**
  - `55.0°C`: High temperature warning flag.
  - `65.0°C`: Critical thermal surge alert flag.

### 🚩 3. Intelligent Flagging Features
- **Peer Deviation & Underperformance Flag (`UNDERPERFORMING` / `CRITICAL_DROP`):**
  - Compares each panel against the median power of all 3 panels under identical ambient lighting.
  - An output drop $>30\%$ below peer median triggers `UNDERPERFORMING` (`warning`).
  - An output drop $>50\%$ below peer median triggers `CRITICAL_DROP` (`critical`).
- **Low Ambient Light Flag (`LOW_LIGHT`):**
  - Suppresses false underperformance alarms when median generation $< 0.20$ W (dusk, night, heavy cloud).
- **Sensor Communication Fault Flag (`SENSOR_FAULT`):**
  - Flags I2C communication failures or disconnected sensors.
- **Cleaning Recommendation Flag (`cleaning_recommended: true`):**
  - Raised when a panel is underperforming while temperature and electrical sensors are healthy.

### 🧹 4. SG90 Wiper Protection
- **Non-blocking State Machine:** Sweeps forward and return without blocking sensor reads or MQTT command checks.
- **Automatic Servo Detach:** Cuts PWM power when parked at home (20°) to prevent motor jitter, coil heating, or burnout.
- **Emergency Stop:** Immediate halt command (`STOP`) parks the wiper and cuts PWM within 15 ms.

---

## 5. MQTT Topic Architecture (EMQX Cloud)

| Topic | Direction | Payload Structure / Sample | Purpose |
|:---|:---|:---|:---|
| `solarguard/telemetry` | **ESP32 ➔ App** | Detailed JSON with `panels` (voltage, current, power, status, flags), `temperature`, `median_power`, `flags` | Primary real-time telemetry stream (every 2.5s) |
| `solarguard/alerts` | **ESP32 ➔ App** | `{"type":"PEER_UNDERPERFORMANCE","severity":"warning","panel_id":3,...}` | Instant notifications on threshold or flag state changes |
| `solarguard/wiper/status` | **ESP32 ➔ App** | `{"state":"wiping","progress":50,...}` | Real-time actuation progress |
| `solarguard/wiper/command` | **App ➔ ESP32** | `{"command":"WIPE"}` or `"STOP"` or `"RESET"` | Control wiper sweeps and emergency stop |
| `solarguard/status` | **ESP32 ➔ App** | `{"online":true,"uptime_sec":120,"sensors":{...}}` | Heartbeat (15s) and MQTT Last Will & Testament |
| `solarguard/temperature` | **ESP32 ➔ App** | `{"temperature_c":28.5,"unit":"C"}` | Dedicated temperature mirror |
