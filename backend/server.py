# backend/server.py
import time, asyncio, json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mission Control Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True, "service": "mission-control"}

@app.get("/api/status")
def status():
    return {"controller": "Connected", "labjack_sim": True}

# ---- simple simulated stream
@app.websocket("/ws")
async def ws_stream(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            ts = time.time()
            # fake data
            payload = {
                "ts": ts,
                "pressures": [250, 260, 255, 240, 245, 250],
                "thermocouple": 24.5,
                "thrust": 500 + 100 * (0.5),
                "batteries": {"teensy": 12.1, "labjack": 4.98},
                "valves": [False, False, False, False],
            }
            await ws.send_json(payload)
            await asyncio.sleep(0.05)  # 20 Hz
    except WebSocketDisconnect:
        return
