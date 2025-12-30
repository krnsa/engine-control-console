/**
 * Liquid Rocket Engine Control Backend
 * Node.js side (GUI + state + networking)
 * Hardware handled by Python DAQ service
 */

const http = require("http");
const { initWebSocket } = require("./stream/websocket");
const { engineState } = require("./state/engineState");
const { startPythonReceiver } = require("./acquisition/pythonReceiver");

const SERVER_PORT = 8080;

function startServer() {
  // HTTP server (used by WebSocket)
  const server = http.createServer();

  server.listen(SERVER_PORT, () => {
    console.log(`[BACKEND] Server running on port ${SERVER_PORT}`);
  });

  // WebSocket → GUI
  initWebSocket(server);

  // TCP server ← Python DAQ
  startPythonReceiver();

  // Graceful shutdown
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function shutdown() {
  console.log("[BACKEND] Graceful shutdown initiated");
  process.exit(0);
}

// Initialize engine state
engineState.initialize();

// Start backend
startServer();
