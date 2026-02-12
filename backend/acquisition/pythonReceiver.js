/**
 *@ Author: Aditya Sharma
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
  scaleCurrentLoopLb,
  scaleValveState
} = require("./scaling");

const PORT = 9000;

const {
  pressureMaxPsi,
  pressureZeroOffsetPsi,
  pressureSpanMa,
  pressureDeadbandPsi, // Pressure Deadband 
  loadCell1LbfPerVolt,
  loadCell1MaxLb,
  loadCell1ZeroOffsetLb,
  loadCell2MaxLb,
  loadCell2ZeroOffsetLb
} =
  SYSTEM_CONFIG.calibration;

const SMOOTHING_ALPHA = SYSTEM_CONFIG.smoothing?.alpha ?? 0.1; // changing 0.2 smooth to 0.1 smooth
const smoothingState = {};

function smoothValue(key, value) {
  if (typeof value !== "number") return null;
  const prev = smoothingState[key];
  const next = typeof prev === "number"

    ? (SMOOTHING_ALPHA * value) + ((1 - SMOOTHING_ALPHA) * prev)
    : value;
  smoothingState[key] = next;
  return next;
}

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
            smoothValue("pt1", scalePressurePsi(pressures.pt1 ?? pressures.lox, pressureMaxPsi.pt1, pressureZeroOffsetPsi?.pt1 ?? 0, pressureSpanMa?.pt1 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt2 =
            smoothValue("pt2", scalePressurePsi(pressures.pt2, pressureMaxPsi.pt2, pressureZeroOffsetPsi?.pt2 ?? 0, pressureSpanMa?.pt2 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt3 =
            smoothValue("pt3", scalePressurePsi(pressures.pt3, pressureMaxPsi.pt3, pressureZeroOffsetPsi?.pt3 ?? 0, pressureSpanMa?.pt3 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt4 =
            smoothValue("pt4", scalePressurePsi(pressures.pt4, pressureMaxPsi.pt4, pressureZeroOffsetPsi?.pt4 ?? 0, pressureSpanMa?.pt4 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt5 =
            smoothValue("pt5", scalePressurePsi(pressures.pt5, pressureMaxPsi.pt5, pressureZeroOffsetPsi?.pt5 ?? 0, pressureSpanMa?.pt5 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt6 =
            smoothValue("pt6", scalePressurePsi(pressures.pt6 ?? pressures.chamber, pressureMaxPsi.pt6, pressureZeroOffsetPsi?.pt6 ?? 0, pressureSpanMa?.pt6 ?? 16, pressureDeadbandPsi ?? 0));

          engineState.data.thrust.loadCell1 =
            smoothValue("loadCell1", scaleCurrentLoopLb(parsed.thrust?.loadCell1 ?? parsed.thrust?.loadCell, loadCell1MaxLb, loadCell1ZeroOffsetLb ?? 0));

          engineState.data.weight.loadCell2 =
            smoothValue("loadCell2", scaleCurrentLoopLb(parsed.weight?.loadCell2, loadCell2MaxLb, loadCell2ZeroOffsetLb ?? 0));

          engineState.data.temperature.tt1 =
            smoothValue("tt1", typeof parsed.temperature?.tt1 === "number" ? parsed.temperature.tt1 : null);

          engineState.data.valves.mfv =
            scaleValveState(parsed.valves?.mfv);

          engineState.data.valves.mov =
            scaleValveState(parsed.valves?.mov);

          engineState.data.valves.tvv =
            scaleValveState(parsed.valves?.tvv);

          engineState.data.valves.ofv =
            scaleValveState(parsed.valves?.ofv);

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

          if (parsed.spares || parsed.system?.spares) {
            const next = parsed.spares || parsed.system?.spares;
            engineState.data.system.spares = {
              ...engineState.data.system.spares,
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
