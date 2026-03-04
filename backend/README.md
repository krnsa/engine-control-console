# Backend README

Node.js backend for the engine control console. This service owns live state, receives DAQ data, polls the PLC, streams state to the GUI, and writes telemetry logs.

## What the backend does

- Starts an HTTP server on port `8080` for the WebSocket layer used by the frontend.
- Starts a TCP receiver on port `9000` for newline-delimited JSON from the Python DAQ service.
- Polls the PLC over Modbus for sequence state, timer data, tank model values, and ignitor continuity.
- Reads Arduino serial events from the configured COM port.
- Logs telemetry to CSV.

Main entry point:

- `backend/server.js`

## Main backend components

- `backend/server.js`
  - Starts the backend services.
- `backend/acquisition/pythonReceiver.js`
  - Receives Python DAQ packets and applies scaling.
- `backend/acquisition/plcSequencePoller.js`
  - Polls PLC Modbus data.
- `backend/acquisition/arduinoSerial.js`
  - Reads Arduino serial events.
- `backend/acquisition/scaling.js`
  - Converts raw analog values into engineering units.
- `backend/state/engineState.js`
  - Holds the live shared state sent to the GUI.
- `backend/logging/logger.js`
  - Writes telemetry CSV files.
- `backend/daq/labjack_reader.py`
  - Python LabJack DAQ process that feeds this backend.

## Install

From the `backend` folder:

```powershell
npm install
```

If you are running the Python DAQ service on the same machine:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install labjack-ljm
```

`backend/requirements.txt` is currently only a placeholder comment file, so `labjack-ljm` is the package that matters for the DAQ reader here.

## Run

From the `backend` folder:

```powershell
npm start
```

Expected backend services after startup:

- WebSocket server on `ws://localhost:8080`
- TCP DAQ receiver on port `9000`

## Python DAQ

The backend expects the LabJack DAQ process to connect to port `9000`.

Run it from the `backend` folder:

```powershell
.venv\Scripts\activate
python daq/labjack_reader.py
```

Current DAQ notes:

- LabJack connection is set to Ethernet in `backend/daq/labjack_reader.py`
- TT-1 thermocouple is read on `AIN8`
- Load Cell 2 is read on `AIN6`
- Load Cell 1 is read on `AIN7`

## Configuration

Primary config file:

- `backend/config/system.config.js`

Important sections:

- `calibration`
  - PT calibration
  - load cell calibration
  - TT-1 4-20 mA temperature scaling
- `sensors.availability`
  - enables or disables sensor values in software
- `plcSequence`
  - Modbus host, registers, polling, tank model, ignitor continuity
- `logging`
  - CSV target directory
  - video directory health-check target
- `arduinoSerial`
  - COM port and baud rate

Telemetry channel metadata:

- `backend/config/channels.json`

## Logging

The backend logger writes CSV telemetry.

Current configured paths:

- CSV directory: `D:/Test Data`
- video check directory: `D:/Recordings`

These are defined in:

- `backend/config/system.config.js`

If `strictExternalPaths` is enabled, logging expects those paths to exist.

## Cameras

The backend does not record camera video itself.

Camera recording is handled by MediaMTX using:

- `mediamtx.yml`

The backend only monitors the configured video directory and reports logging health in the GUI.

## Troubleshooting

If the frontend shows no live data:

1. Confirm `npm start` is running in `backend`
2. Confirm `python daq/labjack_reader.py` is connected
3. Confirm the frontend is pointed at `ws://localhost:8080`

If PLC sequence is offline:

1. Check `backend/config/system.config.js`
2. Verify PLC IP, unit ID, and Modbus register type
3. Verify the laptop is on the PLC network

If CSV logging is red in the GUI:

1. Confirm `D:/Test Data` exists
2. Confirm the SD card or external storage is mounted
3. Confirm the backend has write access
