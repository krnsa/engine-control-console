// frontend/src/engineSocket.js

let socket = null;
let listeners = new Set();
let connectionListeners = new Set();
let reconnectTimer = null;
const RECONNECT_DELAY_MS = 1000;

export const BACKEND_WS_URL = "ws://localhost:8080";

export function connectEngineSocket() {
  if (socket) {
    return;
  }

  socket = new WebSocket(BACKEND_WS_URL);

  socket.onopen = () => {
    console.info("[ENGINE SOCKET] Connected");
    connectionListeners.forEach((cb) => cb({ connected: true }));
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
    connectionListeners.forEach((cb) => cb({ connected: false }));
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectEngineSocket();
      }, RECONNECT_DELAY_MS);
    }
  };


  socket.onerror = (err) => {
    console.error("[ENGINE SOCKET] Error", err);
    connectionListeners.forEach((cb) => cb({ connected: false, error: err }));
  };
}

export function subscribeEngineState(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function subscribeEngineConnection(callback) {
  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}
