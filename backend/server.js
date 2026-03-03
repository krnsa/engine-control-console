/**
 * Author: Aditya Sharma
 * Rutgers Rocket Propulsion Laboratory
 *
 * Liquid Rocket Engine Control Backend
 * Node.js side (GUI + state + networking)
 * Hardware handled by Python DAQ service
 */

const http = require("http");
const { initWebSocket } = require("./stream/websocket");
const { engineState } = require("./state/engineState");
const { startPythonReceiver } = require("./acquisition/pythonReceiver");
const { startArduinoSerial } = require("./acquisition/arduinoSerial");
const { startDataLogger } = require("./logging/logger");
const { startPlcSequencePoller } = require("./acquisition/plcSequencePoller");

const SERVER_PORT = 8080;

function startServer() {
  // HTTP server (used by WebSocket)
  const server = http.createServer();

  server.listen(SERVER_PORT, () => {
    console.log(`[BACKEND] Server running on port ${SERVER_PORT}`);
  });

  // WebSocket -> GUI
  initWebSocket(server);

  // TCP server -> Python DAQ
  startPythonReceiver();

  // Arduino serial -> event stream
  startArduinoSerial();

  // CSV data logger
  const stopLogger = startDataLogger();
  const stopPlcPoller = startPlcSequencePoller();

  // Graceful shutdown
  process.on("SIGINT", () => shutdown({ stopLogger, stopPlcPoller }));
  process.on("SIGTERM", () => shutdown({ stopLogger, stopPlcPoller }));
}

function shutdown({ stopLogger, stopPlcPoller }) {
  console.log("[BACKEND] Graceful shutdown initiated");
  if (typeof stopLogger === "function") {
    stopLogger();
  }
  if (typeof stopPlcPoller === "function") {
    stopPlcPoller();
  }
  process.exit(0);
}

engineState.initialize();


startServer();
