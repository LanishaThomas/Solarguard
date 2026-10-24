# SolarGuard IoT — Smart Solar Panel Monitoring and Auto-Cleaning System

> **Project type:** IoT + Computer Vision/ML + Embedded Systems + Web Application  
> **Working name:** SolarGuard  
> **Goal:** Monitor three small solar panels independently, detect abnormal output, inspect panel surfaces using a camera, provide manual/automatic wiping, and report excessive panel temperature.

---

## 1. Project overview

SolarGuard is a prototype for smart solar-panel health monitoring. It combines electrical measurements, temperature sensing, camera-based surface inspection, and a controllable wiper.

The prototype has three main jobs:

1. **Electrical monitoring:** Measure the voltage and current of each panel independently. Estimate power and flag a panel whose output is significantly lower than the other panels under comparable lighting conditions.
2. **Visual inspection and cleaning:** Use a laptop or mobile camera to capture the panel surface. An ML/computer-vision model classifies visible conditions such as dust, bird droppings, leaves/foreign objects, cracks or breakage, and a clean panel. The user can trigger the wiper manually, or enable automatic cleaning when the system detects a cleanable obstruction.
3. **Temperature monitoring:** Read the panel temperature and alert the user when it exceeds a configurable threshold.

**Important prototype limitation:** a current/voltage sensor can detect an output drop, but cannot reliably tell *why* the output dropped. Shadows, panel angle, changing sunlight, wiring, and sensor errors can all cause lower readings. The camera provides complementary evidence; neither sensor alone proves a fault.

---

## 2. Functional requirements

### 2.1 Panel output monitoring

- Read voltage and current from each of the three panels using one INA219 per panel.
- Calculate power for each panel:
  - `Power (W) = Voltage (V) × Current (A)`
- Record timestamped readings.
- Compare panels only when illumination is reasonably comparable.
- Raise a warning if a panel's power is below a configurable percentage of the median of the three panels for several consecutive samples.
- Display live voltage, current, power, and status for each panel.
- Show a warning such as: `Panel 2 output is 35% below the peer-panel median`.

**Suggested initial rule (tune experimentally):** flag a panel when its power is below 70% of the median of all three panels for 5 consecutive readings. Use a minimum sunlight/output threshold so the system does not flag all panels at dusk or under heavy cloud. These values are starting points, not universal engineering limits.

### 2.2 Camera-based surface inspection

- Capture an image from a laptop webcam or mobile phone.
- Run the image through a trained image-classification or object-detection model.
- Suggested classes:
  - `clean`
  - `dust`
  - `bird_droppings`
  - `leaves_or_foreign_object`
  - `crack_or_breakage`
  - `other_obstruction`
- Show the predicted class and confidence score.
- Store the image only if needed and with the user's consent.
- Let the user configure automatic cleaning on/off.

**Recommended model strategy:** start with image classification using a small transfer-learning model (MobileNetV3 or EfficientNet-B0). If you need to locate an object on the panel, move to object detection (YOLO-family model). A small, well-labelled dataset that resembles your actual panel/camera/light setup is more valuable than a large but mismatched dataset.

**Reality check:** dust can be subtle and may be hard to distinguish from lighting, glare, or panel texture. Cracks may need higher-resolution images and suitable angles. Treat predictions as *suspected conditions*, not guaranteed diagnoses. Capture images under consistent lighting where possible.

### 2.3 Manual and automatic wiper

- Provide an app button: `Wipe now`.
- Provide an `Automatic cleaning` toggle.
- In automatic mode, start cleaning only when the model detects a **cleanable** condition above a confidence threshold.
- Do **not** automatically wipe a predicted crack/breakage. Send an alert for human inspection instead.
- Add a cooldown between cleaning cycles to prevent repeated wiping.
- Stop the servo after a defined sweep/time, and include a physical power switch or emergency stop.
- Show cleaning status: `Idle`, `Wiping`, `Cooldown`, or `Fault`.

### 2.4 Temperature monitoring

- Read the DS18B20 temperature periodically.
- Show the current temperature and a history chart.
- Alert when the temperature exceeds a configurable threshold for a defined duration, to avoid reacting to one noisy sample.
- Provide a clear indication if the sensor is disconnected or returns an invalid reading.

**Threshold note:** choose the alert temperature based on the panel/module datasheet and the project test conditions. Do not assume one universal safe threshold for every panel. For the demonstration, use a configurable example threshold and label it as a prototype setting.

### 2.5 App and notifications

- Live panel cards for Panel 1, Panel 2, and Panel 3.
- Temperature card.
- Camera inspection result and confidence.
- Manual `Wipe now` control.
- Automatic-cleaning toggle.
- Alerts/history page.
- Connection status for ESP32 and camera/inference service.
- Optional email/push notifications in a later version.

---

## 3. Proposed architecture

```text
                   ┌──────────────────────────────┐
                   │ Frontend Web App             │
                   │ React + Vite + Chart library│
                   └──────────────┬───────────────┘
                                  │ HTTPS / WebSocket
                   ┌──────────────▼───────────────┐
                   │ Backend API                  │
                   │ Python FastAPI               │
                   │ Auth, rules, alerts, commands│
                   └───────┬──────────────┬───────┘
                           │              │
                    ┌──────▼─────┐  ┌─────▼────────────────┐
                    │ Database   │  │ ML Inference Service │
                    │ Firebase   │  │ Python + OpenCV +    │
                    │ or SQLite/ │  │ PyTorch              │
                    │ PostgreSQL │  └─────────▲────────────┘
                    └────────────┘            │ image
                                              │
                                  Laptop/mobile camera
                                              │
                 Wi-Fi / MQTT or HTTP         │
          ┌───────────────────────────────────┴───────┐
          │ ESP32 controller                          │
          │ reads sensors, drives servo, safety logic│
          └─────┬───────────┬───────────┬────────────┘
                │           │           │
             INA219 x3   DS18B20    Servo + wiper
                │
          Solar panel x3
```

### Recommended data flow

1. ESP32 samples the three INA219 modules and DS18B20.
2. ESP32 publishes readings to the backend using MQTT or HTTP over Wi-Fi.
3. Backend stores readings, evaluates alert rules, and makes data available to the frontend.
4. Camera captures a frame and sends it to the ML inference service.
5. Inference service returns class and confidence.
6. Backend applies the cleaning policy and sends a command to ESP32 when appropriate.
7. ESP32 validates the command and drives the servo within safe limits.
8. The app shows telemetry, alerts, predictions, and cleaning state.

**Camera connectivity choice:** the simplest first prototype is to connect a laptop webcam to a Python/OpenCV process on the laptop. That process can send images/predictions to the backend over the local network. A mobile phone can instead open a web page that captures an image and uploads it. Neither camera has to be electrically connected to the ESP32.

---

## 4. Hardware bill of materials

### Parts already selected

| Component | Quantity | Role | Notes |
|---|---:|---|---|
| Mini 6 V solar panel, ~1–5 W | 3 | Test panels | Keep all panels similarly oriented for fair comparison. |
| INA219 voltage/current sensor module | 3 | Per-panel electrical measurement | One module per panel. Confirm module voltage/current ratings and shunt configuration. |
| DS18B20 temperature sensor | 1 | Panel temperature | Use a waterproof probe if exposed to outdoor conditions. |
| ESP32 development board | 1 | Main controller | Wi-Fi telemetry, sensor reading, servo commands. |
| SG90 servo motor | 1 | Wiper movement | Suitable only for a very light, low-friction wiper. Test torque before mounting. |
| Regulated 5 V supply | 1 | Servo power | Must supply the servo's peak current without browning out the ESP32. |
| Soft wiper strip | 1 | Panel cleaning | Soft, non-abrasive material; avoid scratching the panel surface. |

### Additional parts strongly recommended

| Component | Why it is useful |
|---|---|
| Breadboard or screw-terminal prototype board | Reliable connections during prototyping. |
| Jumper wires and suitable connectors | Sensor and power wiring. |
| 4.7 kΩ resistor | DS18B20 data-line pull-up (typical for a 3.3 V logic setup). |
| Separate 5 V servo supply with adequate current rating | Avoids ESP32 resets when the servo starts or stalls. |
| Common ground wiring | ESP32 and servo signal need a shared ground reference. |
| Inline fuse / current-limited supply | Adds protection during testing. |
| Physical power switch or emergency-stop switch | Lets the user disable the motor quickly. |
| Mechanical wiper guide/rail and bracket | Keeps the servo from bending or jamming. |
| Enclosure and cable strain relief | Protects electronics from dust and accidental shorts. |
| Optional LED/buzzer | Local indication of warnings or cleaning. |

**Power safety:** do not power the SG90 from the ESP32's 3.3 V pin. Use a regulated 5 V supply sized for the servo's peak/stall demand; small servos can draw several hundred milliamps or more during movement/stall. Connect the supply ground to ESP32 ground, while keeping the servo's 5 V positive rail separate from the ESP32 3.3 V rail. Confirm the exact board wiring and supply ratings before powering the circuit.

---

## 5. Electrical design and wiring notes

### 5.1 One INA219 per panel

Each INA219 measures the voltage/current of its own panel circuit. Follow the labels and schematic for the *specific INA219 breakout board* purchased, because terminal labels and supported voltage differ between variants.

Typical I²C wiring for all three modules:

| ESP32 | INA219 #1 | INA219 #2 | INA219 #3 |
|---|---|---|---|
| 3V3 | VCC | VCC | VCC |
| GND | GND | GND | GND |
| SDA (commonly GPIO 21) | SDA | SDA | SDA |
| SCL (commonly GPIO 22) | SCL | SCL | SCL |

**Important:** all three INA219 modules commonly ship with the same default I²C address. You cannot simply connect all three unchanged to the same I²C bus and expect them to work independently. Options:

1. Use an I²C multiplexer such as a TCA9548A (recommended if the modules have identical fixed addresses).
2. Change the address jumpers on modules that support alternate addresses, ensuring all addresses are unique.
3. Use separate I²C buses only if your ESP32 software and pin plan support them.

Do not assume a module's address can be changed without checking its actual breakout board.

**Measurement topology:** the INA219's shunt must be in series with the measured current path, while its bus-voltage connection must be wired according to the module diagram. If the panel is connected to a load, the sensor should measure the intended panel/load path. A panel's open-circuit voltage and its loaded operating voltage are different, so compare readings under a consistent load/test setup.

### 5.2 DS18B20

Typical 3-wire wiring:

| DS18B20 lead/pin | ESP32 connection |
|---|---|
| VDD | 3V3 |
| GND | GND |
| DATA | A suitable digital GPIO (example GPIO 4) |
| Pull-up | 4.7 kΩ between DATA and 3V3 |

Check the sensor pinout; waterproof probe wire colours are not guaranteed to follow one universal standard. Attach the probe to the back of a panel using a thermally suitable, weather-safe method without damaging the panel.

### 5.3 SG90 servo

| Servo wire (typical colours; verify the exact model) | Connection |
|---|---|
| GND | External 5 V supply GND |
| V+ | External regulated 5 V positive |
| Signal | ESP32 PWM-capable GPIO (example GPIO 18) |

- Connect external supply GND and ESP32 GND together.
- Do not connect the servo's 5 V positive line to the ESP32 3.3 V pin.
- Begin with a restricted angle range (for example, a small sweep) and calibrate it mechanically.
- Do not let the servo force the wiper against a hard stop.
- The SG90 rotates through a limited angle; it is not a continuous linear actuator. A linkage/rail must translate its rotation into a left-right wipe. If the panel is wide or the wiper has significant friction, a stronger servo or geared mechanism may be needed.

### 5.4 Solar panels and measurement

- Keep panels separate electrically if you want independent measurements.
- Avoid connecting panel outputs in parallel/series for the first prototype unless the measurement design explicitly accounts for it.
- Use a consistent load so each panel's power reading is meaningfully comparable.
- Do not short a panel to “test current.”
- A current sensor measures current through its shunt; it does not magically measure the panel's maximum possible power. For a basic prototype, measure under a defined load. For accurate maximum-power comparison, use an appropriate MPPT/load measurement arrangement.

---

## 6. Technology stack

### Recommended beginner-friendly stack

| Layer | Technology | Why |
|---|---|---|
| Embedded firmware | Arduino framework for ESP32, C++ | Fastest route to sensor and servo integration. |
| Sensor libraries | Adafruit INA219 (or compatible INA219 library), OneWire, DallasTemperature, ESP32Servo | Commonly used libraries; verify compatibility with your installed board package. |
| Connectivity | Wi-Fi + MQTT (Mosquitto broker) | Lightweight telemetry and command messaging. HTTP/REST is a simpler alternative for the first demo. |
| Backend | Python + FastAPI | REST endpoints, validation, command handling, and easy ML integration. |
| ML / computer vision | Python, OpenCV, PyTorch, torchvision | Webcam capture, image preprocessing, model training/inference. |
| Initial ML model | MobileNetV3 or EfficientNet-B0 transfer learning | Practical starting point for a small labelled dataset. |
| Frontend | React + Vite + TypeScript (or JavaScript) | Interactive dashboard and control panel. |
| Charts | Recharts | Power and temperature trend charts. |
| Real-time UI | WebSocket or periodic REST polling | Live measurements and status updates. |
| Database (prototype) | SQLite | Simple local setup; no separate database server. |
| Database (multi-user/cloud) | PostgreSQL or Firebase | PostgreSQL for relational telemetry/alerts; Firebase for managed real-time app data. Choose one initially. |
| Notifications | In-app alerts first; email/push later | Keeps first version achievable. |
| Development tools | VS Code, Git/GitHub, Arduino IDE or PlatformIO, Python virtual environment | Build, test, and version the project. |
| Deployment (optional) | Local laptop/mini-PC first; cloud later | Camera inference is easiest to debug locally before deployment. |

**Avoid adding every technology at once.** For the first working demo, use ESP32 + HTTP + FastAPI + SQLite + a simple React dashboard. Add MQTT after the sensor-to-dashboard path works. Add cloud deployment only after local integration is stable.

---

## 7. Backend design

### Suggested API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/telemetry` | Receive readings from ESP32. |
| `GET` | `/api/telemetry/latest` | Fetch latest panel and temperature readings. |
| `GET` | `/api/telemetry/history` | Fetch historical readings for charts. |
| `POST` | `/api/inspection` | Submit an image or an ML result. |
| `GET` | `/api/inspection/latest` | Fetch latest surface prediction. |
| `POST` | `/api/commands/wiper` | Request manual wipe or change automatic mode. |
| `GET` | `/api/status` | Get ESP32, camera, and inference service status. |
| `GET` | `/api/alerts` | List warnings and their timestamps. |
| `POST` | `/api/settings` | Update thresholds and cleaning settings. |

### Example telemetry payload

```json
{
  "device_id": "solarguard-esp32-01",
  "timestamp": "2026-10-23T12:00:00Z",
  "panels": [
    {"panel_id": 1, "voltage_v": 5.4, "current_a": 0.18, "power_w": 0.972},
    {"panel_id": 2, "voltage_v": 4.9, "current_a": 0.08, "power_w": 0.392},
    {"panel_id": 3, "voltage_v": 5.2, "current_a": 0.17, "power_w": 0.884}
  ],
  "temperature_c": 42.6
}
```

Values above are illustrative only, not expected or guaranteed readings.

### Example command payload

```json
{
  "mode": "manual",
  "action": "wipe",
  "duration_ms": 1500
}
```

The ESP32 must validate commands locally: clamp servo angles/duration, reject malformed commands, enforce a cooldown, and refuse movement if the mechanism reports a fault. The backend should not be the only safety layer.

### Example alert rules

- **Low output:** panel power below a configurable fraction of peer-panel median for N consecutive samples while output is above a minimum sunlight threshold.
- **High temperature:** temperature exceeds the configured limit for a configured duration.
- **Surface obstruction:** ML class indicates a cleanable obstruction above a confidence threshold.
- **Possible damage:** ML predicts crack/breakage; alert user and disable automatic wiping for that panel.
- **Sensor/device offline:** no valid telemetry received within a configured timeout.
- **Wiper fault:** command timed out, servo movement is blocked, or cleaning cooldown is violated.

---

## 8. Frontend design

### Main dashboard

1. **Panel 1 card:** voltage, current, power, trend, health status.
2. **Panel 2 card:** voltage, current, power, trend, health status.
3. **Panel 3 card:** voltage, current, power, trend, health status.
4. **Temperature card:** current °C, recent history, alert state.
5. **Surface inspection panel:** image preview, predicted class, confidence, timestamp.
6. **Wiper controls:** `Wipe now`, `Stop`/disable control if supported by the mechanism, and `Automatic cleaning` toggle.
7. **Alerts feed:** low output, high temperature, detected debris, possible damage, offline device.
8. **Settings:** output comparison threshold, minimum output, temperature limit, model confidence threshold, cleaning cooldown.

### Example dashboard status text

- `Panel 1 — Normal`
- `Panel 2 — Low output suspected (35% below peer median)`
- `Surface — Leaves/foreign object suspected (91% confidence)`
- `Temperature — 58 °C; above configured limit`
- `Wiper — Cooldown active`

Do not present ML confidence as a guarantee that the label is correct.

---

## 9. ML model and dataset plan

### Phase 1: prove the camera pipeline

- Capture images from the laptop webcam with OpenCV.
- Save labelled sample images in folders by class.
- Test image upload and display the inference result in the frontend.
- Start with a small number of classes: `clean`, `dust`, `bird_droppings`, `foreign_object`, `damage`.

### Phase 2: build a reliable dataset

- Capture your own panel images under different daylight, shade, angles, and distances.
- Include clean examples and examples with safe, removable test obstructions.
- Include variation in panel size, camera quality, glare, and background.
- Split train/validation/test data by **capture session or physical panel**, where possible, to reduce leakage from near-identical images.
- Obtain permission before using people or private spaces in images.
- Do not intentionally scratch or damage a working panel for dataset creation; use printed crack examples or safe mock-ups.

### Phase 3: train and evaluate

- Use transfer learning with MobileNetV3 or EfficientNet-B0.
- Resize/crop consistently (for example, 224×224 for an initial classifier, subject to model requirements).
- Track per-class precision, recall, F1-score, and confusion matrix; overall accuracy alone can hide poor performance on rare damage classes.
- Test on images captured in conditions not used during training.
- If dust or bird-dropping localization is needed, consider object detection or segmentation later.
- Save the trained model and preprocessing configuration together.

### Phase 4: connect ML to cleaning

Suggested policy:
- `clean`: no cleaning.
- `dust`, `bird_droppings`, `leaves_or_foreign_object`: offer a wipe or trigger it if automatic mode is enabled and confidence is high enough.
- `crack_or_breakage`: alert only; **never automatically wipe**.
- `uncertain`/low confidence: ask the user to inspect or recapture the image.

A laptop/mobile camera is not continuously connected to the ESP32 by default. The computer/phone must run the capture-and-inference process or send captured images to the service. For a live demo, mount the camera so the panel stays in frame and test the camera's field of view before training.

---

## 10. Firmware structure

Organize the ESP32 code into separate responsibilities:

```text
firmware/
├── src/
│   ├── main.cpp
│   ├── panel_monitor.cpp       # read three INA219 modules
│   ├── temperature.cpp         # DS18B20
│   ├── wiper_controller.cpp    # safe servo movement
│   ├── connectivity.cpp        # Wi-Fi + HTTP/MQTT
│   ├── alert_rules.cpp         # basic local safety/threshold rules
│   └── config.h                # pins, intervals, thresholds
└── README.md
```

### Firmware loop (conceptual)

```text
boot
  ├─ initialize Wi-Fi and sensors
  ├─ check sensor addresses and connectivity
  └─ enter loop
       ├─ read panel 1, 2, 3
       ├─ read panel temperature
       ├─ validate/filter measurements
       ├─ calculate power and compare panels
       ├─ publish telemetry
       ├─ receive and validate wiper command
       ├─ move servo only within safe limits
       └─ repeat at configured interval
```

Use non-blocking timing (`millis()` or an equivalent scheduler) rather than long `delay()` calls, so telemetry and command handling remain responsive while the wiper operates.

---

## 11. Repository layout

```text
solarguard/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── wiring.md
│   ├── api.md
│   └── testing.md
├── firmware/
│   ├── platformio.ini
│   └── src/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── database.py
│   ├── tests/
│   └── requirements.txt
├── ml/
│   ├── dataset/                # local only; usually do not commit raw images
│   ├── notebooks/
│   ├── train.py
│   ├── predict.py
│   └── models/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── charts/
│   └── package.json
└── .gitignore
```

Keep API keys and credentials in environment variables. Do not commit private images, passwords, `.env` files, virtual environments, model checkpoints, or large datasets to GitHub unless you intentionally use a suitable storage strategy.

---

## 12. Build and integration roadmap

### Milestone 1 — Electrical measurement
- Wire one panel and one INA219.
- Confirm readings with a multimeter and a consistent load.
- Add the other two modules.
- Resolve the I²C address conflict using an I²C multiplexer or unique addresses.
- Calculate and display power.

**Acceptance test:** all three channels return plausible, independent readings; covering/shading one panel changes that channel's readings in a repeatable way.

### Milestone 2 — Temperature
- Wire DS18B20 with a pull-up resistor.
- Compare its reading with a reference thermometer.
- Test disconnected/invalid-sensor handling.

**Acceptance test:** temperature updates reliably and invalid readings produce a sensor warning rather than a false normal value.

### Milestone 3 — Servo and wiper
- Test the SG90 separately using its own regulated 5 V supply.
- Calibrate safe angle limits without the wiper attached.
- Attach a light wiper and check the full movement by hand with power disconnected first.
- Add cooldown, command timeout, and manual control.

**Acceptance test:** the wiper completes a controlled sweep without the ESP32 rebooting, the servo stalling, or the wiper scraping excessively.

### Milestone 4 — Backend telemetry
- Start FastAPI locally.
- Send ESP32 readings over HTTP.
- Store readings in SQLite.
- Test API endpoints using the browser or an API client.

**Acceptance test:** backend receives and stores readings with timestamps and validates missing/out-of-range values.

### Milestone 5 — Dashboard
- Build three panel cards, a temperature card, charts, alerts, and manual/automatic controls.
- Poll the backend or use WebSockets.
- Reflect offline status when telemetry stops.

**Acceptance test:** a panel reading change appears on the dashboard and a manual command reaches the ESP32.

### Milestone 6 — Camera + ML
- Capture frames from laptop/mobile.
- Train or fine-tune the classifier.
- Build an inference endpoint.
- Show class/confidence in the dashboard.

**Acceptance test:** inference runs on test images captured separately from the training set and produces a visible result.

### Milestone 7 — Full integration
- Add automatic-cleaning policy.
- Make the ESP32 enforce movement limits and cooldown independently.
- Test cases: clean panel, obstruction, suspected crack, low panel output, high temperature, offline camera, offline ESP32, failed sensor, stuck wiper.

**Acceptance test:** the system produces correct dashboard statuses, does not clean a suspected damaged panel automatically, and remains safe when Wi-Fi or inference fails.

---

## 13. Test plan

| Test case | Expected behaviour |
|---|---|
| All panels in similar sunlight | Readings are broadly comparable under the same load/setup. |
| Shade one panel | That panel's output drops; a low-output warning appears after the configured persistence period. |
| Dust/leaf/bird-dropping sample image | Model displays predicted class and confidence. |
| Clean image | No automatic cleaning. |
| Crack/breakage prediction | Alert only; automatic wiping is blocked. |
| Manual wipe command | Wiper performs one bounded sweep if the system is ready. |
| Automatic mode off | Visual detection never starts the wiper automatically. |
| Automatic mode on + cleanable obstruction | Wiper activates only if confidence, cooldown, and safety checks pass. |
| High temperature | Alert appears when the configured limit/persistence condition is met. |
| Camera or Wi-Fi offline | Dashboard reports unavailable/stale data; no unsafe automatic command is issued. |
| INA219 or DS18B20 disconnected | Sensor fault is shown; missing values are not treated as zero/normal. |
| Servo stalls or jams | Motor is disabled promptly where possible; manual inspection is requested. |

---

## 14. Risks, limitations, and mitigations

- **Different sunlight:** panel comparison is misleading if one panel is shaded or angled differently. Keep panels co-oriented and compare only under similar conditions.
- **INA219 address collision:** three same-address modules may conflict. Verify addresses and use a multiplexer if needed.
- **Power instability:** servo current spikes can reset the ESP32. Use a separate regulated supply and common ground.
- **Servo torque and mechanics:** an SG90 may not drive a full-size wiper. Keep the prototype small and low-friction, or upgrade the mechanism after testing.
- **Camera perspective/lighting:** glare, shadows, and distance can confuse the model. Fix camera position and diversify training images.
- **False positives:** do not automatically wipe when the model predicts damage or low-confidence results.
- **No feedback from the servo:** an SG90 usually does not confirm that the wiper actually completed a stroke. The first version can infer completion from elapsed time, but a limit switch or position feedback would make it safer.
- **Outdoor exposure:** many hobby boards and servos are not weatherproof. Keep electronics dry and protected.
- **Small-panel scale:** 1–5 W panels are suitable for a tabletop prototype, not for proving performance on a commercial solar array.

---

## 15. Security and reliability

- Use a unique device identifier and authentication token for telemetry/commands.
- Validate API payloads and restrict who can request cleaning.
- Do not expose unauthenticated motor-control endpoints to the public internet.
- Use HTTPS/TLS when deployed beyond a trusted local network.
- Keep local safety limits on the ESP32 so a backend bug cannot command unlimited movement.
- Make manual and automatic mode visible in the UI.
- If the camera, backend, or Wi-Fi is unavailable, default to **no automatic wipe**.
- Log alert reasons, commands, and cleaning outcomes for debugging.

---

## 16. Final recommended implementation choices

For a manageable college prototype, use this exact first-version stack:

- **Hardware:** the listed ESP32, three mini solar panels, three INA219 modules, DS18B20, SG90, 5 V regulated supply, and soft wiper; add a TCA9548A if the INA219 boards cannot use unique addresses.
- **Firmware:** Arduino framework for ESP32 using C++.
- **Camera:** laptop webcam + Python/OpenCV for the initial demo; mobile-camera upload can be a later option.
- **ML:** PyTorch transfer-learning classifier (MobileNetV3 first).
- **Backend:** FastAPI + SQLite.
- **Frontend:** React + Vite + Recharts.
- **Communication:** HTTP first, MQTT as an upgrade.
- **Deployment:** run everything on the laptop/local Wi-Fi first; move to cloud only after end-to-end testing.

This path delivers the full hardware, software, ML, and integration story without forcing you to debug a cloud deployment, broker, database server, and motor-control issue simultaneously.

## 17. Definition of done

The prototype is ready for demonstration when it can:

- [ ] Read and display each panel's voltage, current, and calculated power separately.
- [ ] Detect a sustained relative output drop and issue an alert.
- [ ] Read and display panel temperature and alert on a configured threshold.
- [ ] Inspect an image and report a surface-condition class with confidence.
- [ ] Allow a user to trigger wiping manually.
- [ ] Allow automatic cleaning to be enabled/disabled from the app.
- [ ] Block automatic wiping when damage is suspected or inference is uncertain.
- [ ] Display telemetry, ML predictions, cleaning state, and alerts in one dashboard.
- [ ] Fail safely if sensors, camera, Wi-Fi, backend, or servo mechanism is unavailable.

---

## 18. Quick project summary for a presentation

**SolarGuard is an IoT-based solar-panel monitoring and maintenance prototype.** Three independent INA219 modules measure each panel's voltage and current, while a DS18B20 tracks panel temperature. An ESP32 transmits telemetry to a FastAPI backend and a React dashboard displays power trends and alerts. A laptop or mobile camera supplies images to a PyTorch/OpenCV model that detects likely dust or obstructions and possible damage. Users can operate a servo-driven soft wiper manually or enable rule-based automatic cleaning, with safety rules preventing automatic wiping when panel damage is suspected.
