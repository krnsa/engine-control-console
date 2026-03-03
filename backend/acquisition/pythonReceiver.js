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
  scaleCurrentLoopLb,
  scaleCurrentLoopTemperatureF,
  scaleValveState
} = require("./scaling");

const PORT = 9000;

const {
  pressureMaxPsi,
  pressureZeroMa,
  pressureSpanMa,
  pressureDeadbandPsi, // Pressure Deadband 
  loadCell1MaxLb,
  loadCell1ZeroOffsetLb,
  loadCell1MinMa,
  loadCell1MaxMa,
  loadCell1DeadbandLb,
  loadCell2MaxLb,
  loadCell2ZeroOffsetLb,
  temperatureMinF,
  temperatureMaxF,
  temperatureZeroMa,
  temperatureSpanMa
} =
  SYSTEM_CONFIG.calibration;

const sensorAvailability = SYSTEM_CONFIG.sensors?.availability || {};

const SMOOTHING_ALPHA = SYSTEM_CONFIG.smoothing?.alpha ?? 0.1; // changing 0.2 smooth to 0.1 smooth
const PER_CHANNEL_ALPHA = SYSTEM_CONFIG.smoothing?.perChannelAlpha || {};
const smoothingState = {};

function resolveAlpha(key, alphaOverride) {
  const raw =
    typeof alphaOverride === "number"
      ? alphaOverride
      : typeof PER_CHANNEL_ALPHA?.[key] === "number"
      ? PER_CHANNEL_ALPHA[key]
      : SMOOTHING_ALPHA;
  return Math.min(1, Math.max(0.001, raw));
}

function smoothValue(key, value, alphaOverride = undefined) {
  if (typeof value !== "number") return null;
  const prev = smoothingState[key];
  const alpha = resolveAlpha(key, alphaOverride);
  const next = typeof prev === "number"
    ? (alpha * value) + ((1 - alpha) * prev)
    : value;
  smoothingState[key] = next;
  return next;
}

function applyAvailability(sensorKey, value) {
  const enabled = sensorAvailability[sensorKey];
  if (enabled === false) return null;
  return value;
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
            smoothValue("pt1", scalePressurePsi(pressures.pt1 ?? pressures.lox, pressureMaxPsi.pt1, pressureZeroMa?.pt1 ?? 4, pressureSpanMa?.pt1 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt2 =
            smoothValue("pt2", scalePressurePsi(pressures.pt2, pressureMaxPsi.pt2, pressureZeroMa?.pt2 ?? 4, pressureSpanMa?.pt2 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt3 =
            smoothValue("pt3", scalePressurePsi(pressures.pt3, pressureMaxPsi.pt3, pressureZeroMa?.pt3 ?? 4, pressureSpanMa?.pt3 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt4 =
            smoothValue("pt4", scalePressurePsi(pressures.pt4, pressureMaxPsi.pt4, pressureZeroMa?.pt4 ?? 4, pressureSpanMa?.pt4 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt5 =
            smoothValue("pt5", scalePressurePsi(pressures.pt5, pressureMaxPsi.pt5, pressureZeroMa?.pt5 ?? 4, pressureSpanMa?.pt5 ?? 16, pressureDeadbandPsi ?? 0));
          engineState.data.pressures.pt6 =
            smoothValue("pt6", scalePressurePsi(pressures.pt6 ?? pressures.chamber, pressureMaxPsi.pt6, pressureZeroMa?.pt6 ?? 4, pressureSpanMa?.pt6 ?? 16, pressureDeadbandPsi ?? 0));

          engineState.data.thrust.loadCell1 =
            applyAvailability(
              "loadCell1",
              smoothValue(
                "loadCell1",
                scaleCurrentLoopLb(
                  parsed.thrust?.loadCell1 ?? parsed.thrust?.loadCell,
                  loadCell1MaxLb,
                  loadCell1ZeroOffsetLb ?? 0,
                  16,
                  249,
                  loadCell1MinMa ?? 3.5,
                  loadCell1MaxMa ?? 20.8,
                  loadCell1DeadbandLb ?? 0
                )
              )
            );

          engineState.data.weight.loadCell2 =
            applyAvailability(
              "loadCell2",
              smoothValue(
                "loadCell2",
                scaleCurrentLoopLb(parsed.weight?.loadCell2, loadCell2MaxLb, loadCell2ZeroOffsetLb ?? 0)
              )
            );

          engineState.data.temperature.tt1 =
            applyAvailability(
              "tt1",
              smoothValue(
                "tt1",
                scaleCurrentLoopTemperatureF(
                  parsed.temperature?.tt1,
                  temperatureMinF,
                  temperatureMaxF,
                  temperatureZeroMa ?? 4,
                  temperatureSpanMa ?? 16
                )
              )
            );

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

          if (parsed.sequence || parsed.system?.sequence) {
            const next = parsed.sequence || parsed.system?.sequence;
            engineState.data.system.sequence = {
              ...engineState.data.system.sequence,
              ...next,
              lastRead: Date.now()
            };
          }

          if (parsed.cutdown || parsed.system?.cutdown) {
            const next = parsed.cutdown || parsed.system?.cutdown;
            engineState.data.system.cutdown = {
              ...engineState.data.system.cutdown,
              ...next,
              lastUpdate: Date.now()
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
