// frontend/src/engineSocket.js

let socket = null;
let listeners = new Set();

const BACKEND_WS_URL = "ws://localhost:8080";

export function connectEngineSocket() {
  if (socket) {
    return;
  }

  socket = new WebSocket(BACKEND_WS_URL);

  socket.onopen = () => {
    console.info("[ENGINE SOCKET] Connected");
  };

  socket.onmessage = (event) => {
    try {
      const state = JSON.parse(event.data);
      listeners.forEach((cb) => cb(state));
    } catch (err) {
      console.error("[ENGINE SOCKET] Invalid state payload", err);
    }
  };

  socket.onclose = () => {
    console.warn("[ENGINE SOCKET] Disconnected");
    socket = null;
  };


  socket.onerror = (err) => {
    console.error("[ENGINE SOCKET] Error", err);
  };
}

export function subscribeEngineState(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
