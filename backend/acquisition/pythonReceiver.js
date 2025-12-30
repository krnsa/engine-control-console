/**
 * Python DAQ TCP receiver
 *
 * Receives raw DAQ data from the Python LabJack process,
 * applies scaling, updates engine state, and triggers
 * safety and fault evaluation.
 */

const net = require("net");
const { engineState } = require("../state/engineState");
const {
  scalePressurePsi,
  scaleThrustLbf,
  scaleValveState
} = require("./scaling");

const PORT = 9000;

// Calibration constants (must match test documentation)
const CHAMBER_PRESSURE_MAX_PSI = 1200;
const LOX_PRESSURE_MAX_PSI = 800;
const LOAD_CELL_CAL_FACTOR = 1000; // lbf per volt

function startPythonReceiver() {
  const server = net.createServer((socket) => {
    console.log("[DAQ] Python DAQ connected");

    engineState.data.system.daqOnline = true;

    socket.on("data", (buffer) => {
      const messages = buffer.toString().trim().split("\n");

      messages.forEach((msg) => {
        try {
          const parsed = JSON.parse(msg);

          engineState.data.pressures.chamber =
            scalePressurePsi(parsed.pressures?.chamber, CHAMBER_PRESSURE_MAX_PSI);

          engineState.data.pressures.lox =
            scalePressurePsi(parsed.pressures?.lox, LOX_PRESSURE_MAX_PSI);

          engineState.data.thrust.loadCell =
            scaleThrustLbf(parsed.thrust?.loadCell, LOAD_CELL_CAL_FACTOR);

          engineState.data.valves.mainValve =
            scaleValveState(parsed.valves?.mainValve);

          engineState.data.valves.ventValve =
            scaleValveState(parsed.valves?.ventValve);

          engineState.data.timestamp = Date.now();
          engineState.data.system.lastUpdate = Date.now();
          engineState.data.system.daqOnline = true;

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
  });

  server.listen(PORT, () => {
    console.log(`[DAQ] Waiting for Python DAQ on port ${PORT}`);
  });
}

module.exports = { startPythonReceiver };
