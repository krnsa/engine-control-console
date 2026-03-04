# New Laptop Setup and Recovery

This document is the full rebuild checklist for bringing this project onto a new Windows laptop and getting the frontend, backend, DAQ, PLC, and camera stack running again.

## 1. Clone the repository

```powershell
git clone <your-github-repo-url>
cd engine-control-console
```

## 2. Software to install on the laptop

Install these before trying to run the stack.

Core development/runtime tools:

- Git
- Node.js LTS
- Python 3.10 or newer
- npm (installed with Node.js)

Hardware and DAQ tools:

- LabJack LJM driver/runtime
- Kipling (LabJack utility)
- AGFRC servo programmer
- USB-to-serial drivers if the Arduino/adapter needs them

Camera and recording tools:

- MediaMTX

Recommended Windows utilities:

- A code editor such as VS Code
- A terminal you are comfortable using (`PowerShell` or `cmd`)

## 3. Install project dependencies

### Backend Node dependencies

```powershell
cd backend
npm install
```

### Frontend Node dependencies

```powershell
cd ..\frontend
npm install
```

### Python DAQ environment

```powershell
cd ..\backend
python -m venv .venv
.venv\Scripts\activate
pip install labjack-ljm
```

Note:

- `backend/requirements.txt` is currently only placeholder comments, so the critical Python package here is `labjack-ljm`.

## 4. Storage folders required for logging

This project is currently configured to log to an external drive.

Create or verify these folders:

- `D:\Test Data`
- `D:\Recordings`

These paths are defined in:

- `backend/config/system.config.js`
- `mediamtx.yml`

If the external storage is not mounted as `D:`, logging health will fail and CSV/video recording checks in the GUI will go red.

## 5. Backend setup and run

Open a terminal in the repo root, then:

```powershell
cd backend
npm start
```

What this starts:

- HTTP/WebSocket server on `ws://localhost:8080`
- TCP receiver on port `9000` for the Python DAQ service
- PLC sequence poller
- Arduino serial reader
- CSV logger

Primary backend entry file:

- `backend/server.js`

## 6. Frontend setup and run

Open another terminal:

```powershell
cd frontend
npm run dev
```

What this does:

- Starts the React + Vite frontend dev server
- Connects the GUI to `ws://localhost:8080`

Frontend package file:

- `frontend/package.json`

## 7. Python DAQ setup and run

Open another terminal:

```powershell
cd backend
.venv\Scripts\activate
python daq/labjack_reader.py
```

Current DAQ behavior:

- Connects to the LabJack T7 over Ethernet
- Sends newline-delimited JSON to `127.0.0.1:9000`

Current key analog mappings in `backend/daq/labjack_reader.py`:

- `AIN0` -> PT-1
- `AIN1` -> PT-2
- `AIN2` -> PT-3
- `AIN3` -> PT-4
- `AIN4` -> PT-5
- `AIN5` -> PT-6
- `AIN6` -> Load Cell 2
- `AIN7` -> Load Cell 1
- `AIN8` -> TT-1 thermocouple transmitter

If Ethernet LabJack access is not available, the connection mode in `backend/daq/labjack_reader.py` must be changed manually.

## 8. Camera setup and startup

Camera streaming and recording are handled by MediaMTX.

Current camera sources in `mediamtx.yml`:

- `cam1` -> `rtsp://admin:123456@192.168.1.6:554/Streaming/channels/101`
- `cam2` -> `rtsp://admin:123456@192.168.1.7:554/Streaming/channels/101`

Current recording configuration:

- enabled with `pathDefaults.record: yes`
- recordings written to:
  - `D:/Recordings/%path/%Y-%m-%d_%H-%M-%S`

To start MediaMTX:

```powershell
cd C:\Users\Aditya Sharma\engine-control-console
mediamtx mediamtx.yml
```

Or, if you are using the downloaded executable directly:

```powershell
"C:\path\to\mediamtx.exe" "C:\Users\Aditya Sharma\engine-control-console\mediamtx.yml"
```

Expected endpoints after MediaMTX starts:

- WebRTC listener on `http://localhost:8889`
- Camera pages used by the GUI are served from MediaMTX

What to verify in the MediaMTX console:

- both `cam1` and `cam2` report `stream is available and online`
- recorder lines appear for each camera

## 9. Arduino serial setup

The backend also listens for Arduino serial events.

Current serial config is in:

- `backend/config/system.config.js`

Current setting:

- `arduinoSerial.port = "COM3"`
- `arduinoSerial.baudRate = 9600`

If the new laptop assigns a different COM port, update this before starting the backend.

## 10. PLC / network configuration

The PLC sequence poller is enabled by default.

Current PLC config:

- host: `192.168.1.1`
- port: `502`
- unit ID: `1`

This is defined in:

- `backend/config/system.config.js`

Before testing, verify the laptop can reach:

- PLC at `192.168.1.1`
- camera 1 at `192.168.1.6`
- camera 2 at `192.168.1.7`
- LabJack on the same Ethernet network

Recommended checks:

- recreate any static IP settings from the old laptop
- verify firewall does not block local ports `8080`, `9000`, `8889`, `502`

## 11. Recommended startup order

Use separate terminals.

1. Start the backend

```powershell
cd backend
npm start
```

2. Start the Python DAQ

```powershell
cd backend
.venv\Scripts\activate
python daq/labjack_reader.py
```

3. Start MediaMTX

```powershell
cd C:\Users\Aditya Sharma\engine-control-console
mediamtx mediamtx.yml
```

4. Start the frontend

```powershell
cd frontend
npm run dev
```

## 12. Files you will most likely need to edit on a new machine

- `backend/config/system.config.js`
  - COM port
  - logging directories
  - PLC host/settings
  - sensor calibration if hardware changes
- `backend/daq/labjack_reader.py`
  - LabJack connection mode
  - DAQ channel mapping if wiring changes
- `mediamtx.yml`
  - camera RTSP URLs
  - recording path

## 13. What each major process is responsible for

Frontend:

- Displays the GUI
- Connects to backend WebSocket
- Does not read hardware directly

Backend:

- Owns live state
- Scales data
- Polls PLC
- Writes CSV logs
- Reports logging and continuity status to the GUI

Python DAQ:

- Reads LabJack analog and digital channels
- Sends raw DAQ packets to the backend

MediaMTX:

- Pulls RTSP streams from the cameras
- Serves camera streams to the GUI
- Records video files to disk

## 14. Recovery checklist if something is not working

If the GUI loads but shows no live data:

1. Confirm backend is running on port `8080`
2. Confirm Python DAQ is connected to port `9000`
3. Confirm the frontend was started from `frontend` with `npm run dev`

If PT/load cell/TT-1 values are missing:

1. Confirm the LabJack is reachable
2. Confirm channel mappings in `backend/daq/labjack_reader.py`
3. Confirm `sensors.availability` in `backend/config/system.config.js`

If camera windows are blank:

1. Confirm MediaMTX is running
2. Confirm both camera RTSP endpoints are reachable
3. Confirm MediaMTX reports both paths as online

If CSV logging or camera logging shows red in the GUI:

1. Confirm the external drive is mounted as `D:`
2. Confirm `D:\Test Data` exists
3. Confirm `D:\Recordings` exists
4. Confirm the backend and MediaMTX both have access to those folders

## 15. Recommended backup items

Keep these backed up outside the laptop:

- this full repo
- MediaMTX executable and known-good version
- LabJack installer and LJM installer
- Node.js and Python version notes
- camera IPs and credentials
- Windows network adapter settings
- any hardware calibration sheets
