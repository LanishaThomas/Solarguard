# SolarGuard — Smart Solar Panel Monitoring & Auto-Cleaning System

> IoT + Computer Vision + Embedded Systems + Web Dashboard  
> Status: **Frontend (Demo Mode)** — hardware & backend not yet integrated

---

## What is SolarGuard?

SolarGuard is a prototype smart solar-panel health monitor. It combines:

- **Electrical monitoring** — independent voltage, current, and power readings for 3 panels via INA219 sensors
- **Temperature monitoring** — DS18B20 panel temperature with configurable alert threshold  
- **Visual surface inspection** — ML-based classification (dust, bird droppings, cracks, debris)  
- **Automated wiper** — SG90 servo-driven wiper with manual and auto-clean modes  
- **Real-time dashboard** — React web app with live charts, alerts, and controls

---

## Repository structure

```
solarguard/
├── frontend/          ← React + Vite web app  (this milestone)
├── backend/           ← Python FastAPI         (future milestone)
├── firmware/          ← ESP32 Arduino C++      (future milestone)
├── ml/                ← PyTorch ML model       (future milestone)
├── docs/              ← Architecture, wiring, API docs
└── README.md
```

---

## Frontend — Quick start

### Requirements
- Node.js 18 or higher
- npm 9 or higher

### Install & run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
cd frontend
npm run build
npm run preview
```

---

## Demo mode

The app runs entirely in **Demo Mode** — no hardware or backend needed.  
All sensor readings, camera predictions, and alerts are **simulated locally**.  
A clearly labelled amber banner appears on every page when demo mode is active.

To connect real data, replace the API calls in `src/data/demoData.js` and `src/context/AppContext.jsx` with live fetch calls to the FastAPI backend.

---

## Tech stack

| Layer        | Technology                        |
|---|---|
| Frontend     | React 18 + Vite 6                 |
| Styling      | Tailwind CSS 3                    |
| Charts       | Recharts 2                        |
| Icons        | Lucide React                      |
| State        | React Context + useReducer        |
| Backend      | Python FastAPI *(planned)*        |
| ML/CV        | PyTorch + MobileNetV3 *(planned)* |
| Firmware     | ESP32 + Arduino C++ *(planned)*   |
| Database     | SQLite → PostgreSQL *(planned)*   |

---

## Navigation

| Page               | Description                                      |
|---|---|
| Dashboard          | Live overview — all panels, temp, wiper, alerts  |
| Panel Monitoring   | Per-panel voltage, current, power, peer comparison |
| Camera & Detection | Surface inspection results, class legend         |
| Cleaning Control   | Manual wipe, auto-clean toggle, wipe log         |
| Alerts & History   | Active and resolved system alerts                |
| Settings           | Thresholds, cooldown, confidence, alert rules    |

---

## Hardware (planned integration)

| Component         | Role                              |
|---|---|
| ESP32             | Main controller, Wi-Fi telemetry  |
| INA219 × 3        | Per-panel current/voltage sensing |
| DS18B20           | Panel temperature                 |
| SG90 servo        | Wiper drive                       |
| 5 V regulated PSU | Servo power                       |

See `docs/wiring.md` for wiring details and `SolarGuard_IoT_Project.md` for full spec.

---

## Development roadmap

- [x] Milestone 5 — Frontend dashboard (demo mode)  
- [ ] Milestone 4 — Backend + SQLite telemetry API  
- [ ] Milestone 1 — INA219 sensor firmware  
- [ ] Milestone 2 — DS18B20 temperature firmware  
- [ ] Milestone 3 — Servo / wiper firmware  
- [ ] Milestone 6 — ML camera inference  
- [ ] Milestone 7 — Full end-to-end integration  

---

## Contributing

1. Fork the repository  
2. Create a feature branch: `git checkout -b feature/your-feature`  
3. Commit your changes: `git commit -m "feat: describe your change"`  
4. Push and open a pull request  

---

## License

MIT — see `LICENSE` for details.
