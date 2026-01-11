"""
LabJack T7 Pro DAQ Service
- Reads real hardware
- Streams JSON over TCP to Node backend
"""

import socket
import json
import time
from labjack import ljm

NODE_HOST = "127.0.0.1"
NODE_PORT = 9000
POLL_RATE = 0.05  # 20 Hz

# Update channel mappings to match final LabJack wiring.
CHANNELS = {
    "pressures": {
        "pt1": "AIN0",
        "pt2": "AIN1",
        "pt3": "AIN2",
        "pt4": "AIN3",
        "pt5": "AIN4",
        "pt6": "AIN5"
    },
    "temperature": {
        "tt1": "AIN6"
    },
    "thrust": {
        "loadCell1": "AIN7"
    },
    "weight": {
        "loadCell2": "AIN8"
    },
    "valves": {
        "mainValve": "DIO0",
        "ventValve": "DIO1"
    }
}


def connect_labjack():
    handle = ljm.openS("T7", "ETHERNET", "ANY")
    print("[DAQ] LabJack T7 Pro connected via Ethernet")
    return handle


def read_channels(handle):
    data = {
        "timestamp": time.time(),
        "pressures": {},
        "thrust": {},
        "valves": {}
    }

    for k, ch in CHANNELS["pressures"].items():
        data["pressures"][k] = ljm.eReadName(handle, ch)

    for k, ch in CHANNELS["thrust"].items():
        data["thrust"][k] = ljm.eReadName(handle, ch)

    for k, ch in CHANNELS["weight"].items():
        data.setdefault("weight", {})[k] = ljm.eReadName(handle, ch)

    for k, ch in CHANNELS["temperature"].items():
        data.setdefault("temperature", {})[k] = ljm.eReadName(handle, ch)

    for k, ch in CHANNELS["valves"].items():
        val = ljm.eReadName(handle, ch)
        data["valves"][k] = "OPEN" if val == 1 else "CLOSED"

    return data


def main():
    handle = connect_labjack()

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    while True:
        try:
            sock.connect((NODE_HOST, NODE_PORT))
            break
        except OSError:
            print("[DAQ] Waiting for Node backend...")
            time.sleep(1.0)
    print("[DAQ] Connected to Node backend")

    try:
        while True:
            payload = read_channels(handle)
            sock.sendall((json.dumps(payload) + "\n").encode())
            time.sleep(POLL_RATE)
    except KeyboardInterrupt:
        print("[DAQ] Shutting down")
    finally:
        ljm.close(handle)
        sock.close()


if __name__ == "__main__":
    main()
