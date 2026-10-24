# SolarGuard — Architecture

See the full architecture in `../SolarGuard_IoT_Project.md` Section 3.

## Current state (Milestone 5)

- Frontend only, running in demo mode
- No backend, firmware, or ML connected yet

## Planned data flow

```
ESP32 → HTTP/MQTT → FastAPI backend → WebSocket → React frontend
Mobile camera → OpenCV → ML inference → FastAPI backend
```
