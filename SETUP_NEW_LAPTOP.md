# New Laptop Setup and Recovery

This document is the rebuild checklist for this project if the current laptop is lost or replaced.

## 1. Clone the repo

```powershell
git clone <your-github-repo-url>
cd engine-control-console
```

## 2. Install required software

Install these first:

- Git
- Node.js (LTS)
- Python 3.10+ (with `pip`)
- LabJack LJM driver/runtime
- Kipling (LabJack utility)
- MediaMTX
- AGFRC servo programmer
- IPC tools used by your workflow

## 3. Backend Node setup

```powershell
cd backend
npm install
```

Run backend:

```powershell
npm start
```

Expected services from backend:

- WebSocket server on `ws://localhost:8080`
- TCP receiver on port `9000` for Python DAQ

## 4. Frontend setup

```powershell
cd ..\frontend
npm install
npm run dev
```

Frontend expects backend WebSocket at `ws://localhost:8080`.

## 5. Python DAQ setup (LabJack)

```powershell
cd ..\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python daq/labjack_reader.py
```

Notes:

- `labjack_reader.py` currently connects via Ethernet:
  - `ljm.openS("T7", "ETHERNET", "ANY")`
- If Ethernet is unavailable, switch to USB in code as needed.

## 6. Camera streaming (MediaMTX)

`mediamtx.yml` is configured for:

- `cam1` -> `rtsp://admin:123456@192.168.1.6:554/Streaming/channels/101`
- `cam2` -> `rtsp://admin:123456@192.168.1.7:554/Streaming/channels/101`
- WebRTC output on `http://localhost:8889/cam1` and `http://localhost:8889/cam2`

Run MediaMTX from repo root (or pass config path):

```powershell
mediamtx mediamtx.yml
```

## 7. Serial/Arduino configuration

Backend serial config is in:

- `backend/config/system.config.js`

Current value:

- `arduinoSerial.port = "COM3"`

Update this if the new laptop assigns a different COM port.

## 8. Network/Ethernet checklist

On the new laptop, verify:

- Laptop NIC is on the same subnet as cameras and LabJack.
- Camera IPs are reachable (`192.168.1.6`, `192.168.1.7`).
- Firewall allows local ports used by stack (`8080`, `9000`, `8889`).
- Any static IP configuration from old laptop is recreated.

## 9. Startup order (recommended)

1. Start backend (`backend`, `npm start`)
2. Start Python DAQ (`backend`, venv active, `python daq/labjack_reader.py`)
3. Start MediaMTX (`mediamtx mediamtx.yml`)
4. Start frontend (`frontend`, `npm run dev`)

## 10. Pre-failure backup items to maintain

Keep these backed up in cloud/external drive:

- This repo (GitHub remote)
- Installer files or links + known-good versions for all external tools
- Network settings snapshot (`ipconfig /all`)
- Device credentials/IPs (cameras, LabJack, etc.)
- Any vendor configuration exports (if available)
