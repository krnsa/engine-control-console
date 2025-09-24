# engine-control-console
Liquid Engine Capstone Project 


Liquid Engine Mission Control (Capstone Project)

A modern glass-morphism Mission Control interface with a React + Vite frontend and a FastAPI backend.
This project provides real-time telemetry, safety monitoring, and operator workflow tools for a liquid rocket engine test stand.

📂 Project Structure (bullets)

frontend/

src/

App.jsx – Main application layout

App.css – Layout & styling

index.css – Global glassmorphism styles

components/ – Reusable status cards & UI panels

NavBar.jsx

StatusPanel.jsx

ConnectionsPanel.jsx

TelemetryTiles.jsx

ValvesStatusPanel.jsx

ThrustChart.jsx

… (other components)

package.json – Frontend dependencies

backend/

main.py – FastAPI app entrypoint

requirements.txt – Python dependencies

README.md – Project documentation

.gitignore – Files ignored by Git
🚀 Frontend (React + Vite)
Features

Mission Header + NavBar
MISSION CONTROL branding, tabbed navigation (Overview, Telemetry, Cameras, Checklist, Logs, Settings).

Overview Dashboard

Connections status (controller, sensors, LabJack, cameras)

Battery levels (controller + sensors)

Valve status (read-only open/closed state with indicators)

Thrust Profile chart (live line + rolling average, redline markers)

Nitrous tank fill gauge + VENT button

Pressurization and Propellant Inventory panels

Safety Permissives + Redlines monitor

Floating HUD (top right)

Pad Environment: ambient temp, wind, humidity, baro pressure, crosswind OK flag

Inline global summary: Armed/Disarmed • Pressures • Cameras • Recording

Interlocks state machine (IDLE → FILL → CHILL → IGNITE → ABORT)

Telemetry Data
Click a tile (pressure, temp, nitrous) → opens a live modal chart for that sensor.

Tabs

Telemetry: sensor health badges (drift/noise estimate, green/yellow/red)

Cameras: 3 feeds + camera health stats (fps, drops, temp, reconnects)

Checklist: Run timeline (T-clock), pre/post checklists, procedures, interlocks view

Logs: system logs + visual anomaly hints (frost lines, vent plumes)

Settings: placeholders for calibration, WS URL, theme, units

Running frontend
cd frontend
npm install
npm run dev


App runs at http://localhost:5173
.

⚙️ Backend (FastAPI)
Features

WebSocket endpoint /ws/telemetry that streams live telemetry packets:

{
  "batteries": {"teensy": 12.1, "ljt7": 12.0},
  "pressures": [180,175,0,0,0,0],
  "tc": 22.5,
  "thrust": 312.4,
  "valves": [true,false,false,true],
  "nitrousFill": 0.42
}


Can be replaced with real hardware streams (LabJack, Teensy, sensors).

Includes a simulator fallback when no WS connection is available.

Running backend
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000


Backend WS runs at ws://127.0.0.1:8000/ws/telemetry.

📊 Key Technologies

Frontend: React, Vite, Recharts, React-Icons

Backend: FastAPI, Uvicorn, Python 3.10+

Design: CSS Glassmorphism, responsive grid, modular components

🛡️ Safety & Monitoring

Permissives Matrix (E-stop, purge, interlocks, pressures under limits)

Redlines monitor (Pmax, Tmax, thrust)

Interlocks state machine (visual + inline)

Checklists & Procedures cards