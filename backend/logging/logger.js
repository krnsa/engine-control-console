/**
 * Author: Aditya Sharma
 * Rutgers Rocket Propulsion Laboratory
 *
 * Simple CSV data logger for engine telemetry.
 * Writes a row on a fixed interval using current engine state.
 */

const fs = require("fs");
const path = require("path");
const { engineState } = require("../state/engineState");
const { SYSTEM_CONFIG } = require("../config/system.config");

function formatTimestamp(tsMs) {
  const d = new Date(tsMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function ensureLogDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function buildRow(state) {
  const pressures = state.pressures || {};
  const thrust = state.thrust || {};
  const temperature = state.temperature || {};
  const weight = state.weight || {};
  const valves = state.valves || {};
  const faults = Array.isArray(state.faults) ? state.faults.join("|") : "";

  const timestampMs = state.timestamp ?? Date.now();
  const isoTimestamp = new Date(timestampMs).toISOString();

  return [
    state.timestamp ?? Date.now(),
    isoTimestamp,
    pressures.pt1 ?? "",
    pressures.pt2 ?? "",
    pressures.pt3 ?? "",
    pressures.pt4 ?? "",
    pressures.pt5 ?? "",
    pressures.pt6 ?? "",
    temperature.tt1 ?? "",
    thrust.loadCell1 ?? "",
    weight.loadCell2 ?? "",
    valves.mfv ?? "",
    valves.mov ?? "",
    valves.tvv ?? "",
    valves.ofv ?? "",
    state.system?.daqOnline ? 1 : 0,
    faults
  ].join(",") + "\n";
}

function startDataLogger() {
  const { directory, intervalMs } = SYSTEM_CONFIG.logging;
  ensureLogDirectory(directory);

  const fileName = `telemetry-${formatTimestamp(Date.now())}.csv`;
  const filePath = path.join(directory, fileName);
  const stream = fs.createWriteStream(filePath, { flags: "a" });

  const header = [
    "timestamp_ms",
    "timestamp_iso",
    "pt1_nitrous_tank_psi",
    "pt2_ipa_tank_psi",
    "pt3_oxidizer_feed_psi",
    "pt4_fuel_pre_film_psi",
    "pt5_injector_manifold_psi",
    "pt6_chamber_psi",
    "tt1_throat_temp_f",
    "load_cell1_thrust_lbf",
    "load_cell2_tank_lb",
    "main_fuel_valve_mfv_state",
    "main_oxidizer_valve_mov_state",
    "tank_vent_valve_tvv_state",
    "oxidizer_fill_valve_ofv_state",
    "daq_online",
    "faults"
  ].join(",") + "\n";
  stream.write(header);

  engineState.data.system.logging.active = true;
  engineState.data.system.logging.filePath = filePath;

  const interval = setInterval(() => {
    const row = buildRow(engineState.getState());
    stream.write(row);
    engineState.data.system.logging.lastWrite = Date.now();
  }, intervalMs);

  return () => {
    clearInterval(interval);
    engineState.data.system.logging.active = false;
    stream.end();
  };
}

module.exports = { startDataLogger };
