# engine-control-console
Liquid Engine Capstone Project

Author: Aditya Sharma
Team: Rutgers Rocket Propulsion Laboratory

Mission Control GUI for a liquid rocket engine test stand. The frontend is a React + Vite app, and the backend is a Node.js WebSocket server that receives DAQ data from a Python LabJack reader over TCP.

## Project structure
```
frontend/                React + Vite UI
backend/                 Node.js backend + Python DAQ client
```

## Backend
### Features
- TCP receiver on port 9000 for DAQ packets from the Python LabJack service.
- WebSocket broadcast on port 8080 for the GUI.
- CSV telemetry logging (writes to `backend/logs/` by default).
- Safety limits and fault detection.

### Run backend (Node)
```
cd backend
npm install
npm start
```

### Run DAQ reader (Python, LabJack required)
```
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
python daq/labjack_reader.py
```

## Frontend
### Run frontend
```
cd frontend
npm install
npm run dev
```

The frontend connects to `ws://localhost:8080` by default.

## Configuration
- `backend/config/system.config.js`: calibration constants, safety limits, logging interval.
- `backend/config/channels.json`: telemetry channel definitions for the UI.
- `frontend/src/overlay-mapping.json`: P&ID overlay positions and sensor bindings.

## Notes
- Hardware is not required to run the UI; values will show as offline or empty.
- DAQ packets are expected as newline-delimited JSON over TCP.
