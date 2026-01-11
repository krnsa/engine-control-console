/**
 * Author: Aditya Sharma
 * Rutgers Rocket Propulsion Laboratory
 *
 * Python DAQ TCP receiver
 *
 * Receives raw DAQ data from the Python LabJack process,
 * applies scaling, updates engine state, and triggers
 * safety and fault evaluation.
 */

const net = require("net");
const { engineState } = require("../state/engineState");
const { SYSTEM_CONFIG } = require("../config/system.config");
const {
  scalePressurePsi,
  scaleThrustLbf,
  scaleValveState
} = require("./scaling");

const PORT = 9000;

const { pressureMaxPsi, loadCell1LbfPerVolt, loadCell2LbPerVolt } =
  SYSTEM_CONFIG.calibration;

function startPythonReceiver() {
  const server = net.createServer((socket) => {
    console.log("[DAQ] Python DAQ connected");

    engineState.data.system.daqOnline = true;
    let pending = "";

    socket.on("data", (buffer) => {
      pending += buffer.toString();
      const messages = pending.split("\n");
      pending = messages.pop();

      messages.forEach((msg) => {
        if (!msg) return;
        try {
          const parsed = JSON.parse(msg);

          const pressures = parsed.pressures || {};
          engineState.data.pressures.pt1 =
            scalePressurePsi(pressures.pt1 ?? pressures.lox, pressureMaxPsi.pt1);
          engineState.data.pressures.pt2 =
            scalePressurePsi(pressures.pt2, pressureMaxPsi.pt2);
          engineState.data.pressures.pt3 =
            scalePressurePsi(pressures.pt3, pressureMaxPsi.pt3);
          engineState.data.pressures.pt4 =
            scalePressurePsi(pressures.pt4, pressureMaxPsi.pt4);
          engineState.data.pressures.pt5 =
            scalePressurePsi(pressures.pt5, pressureMaxPsi.pt5);
          engineState.data.pressures.pt6 =
            scalePressurePsi(pressures.pt6 ?? pressures.chamber, pressureMaxPsi.pt6);

          engineState.data.thrust.loadCell1 =
            scaleThrustLbf(parsed.thrust?.loadCell1 ?? parsed.thrust?.loadCell, loadCell1LbfPerVolt);

          engineState.data.weight.loadCell2 =
            scaleThrustLbf(parsed.weight?.loadCell2, loadCell2LbPerVolt);

          engineState.data.temperature.tt1 =
            typeof parsed.temperature?.tt1 === "number" ? parsed.temperature.tt1 : null;

          engineState.data.valves.mainValve =
            scaleValveState(parsed.valves?.mainValve);

          engineState.data.valves.ventValve =
            scaleValveState(parsed.valves?.ventValve);

          engineState.data.timestamp = Date.now();
          engineState.data.system.lastUpdate = Date.now();
          engineState.data.system.daqOnline = true;

          if (parsed.batteries || parsed.system?.batteries) {
            const next = parsed.batteries || parsed.system?.batteries;
            engineState.data.system.batteries = {
              ...engineState.data.system.batteries,
              ...next,
              sensors: {
                ...engineState.data.system.batteries.sensors,
                ...(next?.sensors || {})
              }
            };
          }

          if (parsed.cameras || parsed.system?.cameras) {
            const next = parsed.cameras || parsed.system?.cameras;
            engineState.data.system.cameras = {
              ...engineState.data.system.cameras,
              ...next
            };
          }

          engineState.data.sensors.pt1 = engineState.data.pressures.pt1;
          engineState.data.sensors.pt2 = engineState.data.pressures.pt2;
          engineState.data.sensors.pt3 = engineState.data.pressures.pt3;
          engineState.data.sensors.pt4 = engineState.data.pressures.pt4;
          engineState.data.sensors.pt5 = engineState.data.pressures.pt5;
          engineState.data.sensors.pt6 = engineState.data.pressures.pt6;
          engineState.data.sensors.tt1 = engineState.data.temperature.tt1;
          engineState.data.sensors.loadCell1 = engineState.data.thrust.loadCell1;
          engineState.data.sensors.loadCell2 = engineState.data.weight.loadCell2;

          engineState.updateDerived();
        } catch (err) {
          console.error("[DAQ] Invalid DAQ payload received");
        }
      });
    });

    socket.on("close", () => {
      engineState.data.system.daqOnline = false;
      engineState.updateDerived();
      console.log("[DAQ] Python DAQ disconnected");
    });

    socket.on("error", () => {
      engineState.data.system.daqOnline = false;
      engineState.updateDerived();
      console.log("[DAQ] Python DAQ connection error");
    });
  });

  server.listen(PORT, () => {
    console.log(`[DAQ] Waiting for Python DAQ on port ${PORT}`);
  });
}

module.exports = { startPythonReceiver };
