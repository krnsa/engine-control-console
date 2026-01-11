const WebSocket = require("ws");
const { engineState } = require("../state/engineState");

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("[WS] GUI connected");
    engineState.data.system.wsClients += 1;

    const interval = setInterval(() => {
      ws.send(JSON.stringify(engineState.getState()));
    }, 100); // 10 Hz update rate

    ws.on("close", () => {
      console.log("[WS] GUI disconnected");
      engineState.data.system.wsClients = Math.max(
        0,
        engineState.data.system.wsClients - 1
      );
      clearInterval(interval);
    });
  });

  console.log("[WS] WebSocket initialized");
}

module.exports = { initWebSocket };
