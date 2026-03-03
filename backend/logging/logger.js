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

function formatLocalTimestamp(tsMs) {
  const d = new Date(tsMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

function boolToCsv(value) {
  if (typeof value !== "boolean") return "";
  return value ? 1 : 0;
}

function ensureLogDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getLatestFileInfo(directory) {
  if (!directory || !fs.existsSync(directory)) return null;

  const stack = [directory];
  let latest = null;

  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (!latest || stats.mtimeMs > latest.mtimeMs) {
        latest = { path: fullPath, mtimeMs: stats.mtimeMs, size: stats.size };
      }
    }
  }

  return latest;
}

function buildRow(state) {
  const pressures = state.pressures || {};
  const thrust = state.thrust || {};
  const temperature = state.temperature || {};
  const weight = state.weight || {};
  const valves = state.valves || {};
  const sequence = state.system?.sequence || {};
  const tank = state.system?.tank || {};
  const ignitors = state.system?.ignitors || {};
  const cutdown = state.system?.cutdown || {};
  const faults = Array.isArray(state.faults) ? state.faults.join("|") : "";

  const timestampMs = state.timestamp ?? Date.now();
  const isoTimestamp = new Date(timestampMs).toISOString();
  const localTimestamp = formatLocalTimestamp(timestampMs);

  return [
    state.timestamp ?? Date.now(),
    isoTimestamp,
    localTimestamp,
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
    boolToCsv(sequence.online),
    sequence.code ?? "",
    sequence.name ?? "",
    sequence.timeInStateSec ?? "",
    sequence.plcTimerSec ?? "",
    sequence.registerOffset ?? "",
    tank.tareWeightLbf ?? "",
    tank.fullWeightLbf ?? "",
    tank.fluidWeightLbf ?? "",
    tank.fluidMaxLbf ?? "",
    boolToCsv(ignitors.ignitor1Connected),
    boolToCsv(ignitors.ignitor2Connected),
    boolToCsv(cutdown.continuity),
    faults
  ].join(",") + "\n";
}
// Need to write logic for showing the arduino - serial monitor - directly on GUI 
// Logic is simple - Labjack T7 pro - can read serial which I can then use via websockets same thing - 
// write into the state and then show it on the gui



function startDataLogger() {
  const {
    directory,
    csvDirectory,
    intervalMs,
    videoDirectory,
    videoRecentSec,
    strictExternalPaths
  } = SYSTEM_CONFIG.logging;
  const csvTargetDirectory = csvDirectory || directory;

  if (strictExternalPaths && (!csvTargetDirectory || !fs.existsSync(csvTargetDirectory))) {
    console.error(`[LOGGER] CSV directory unavailable (strict mode): ${csvTargetDirectory || "<unset>"}`);
    engineState.data.system.logging.active = false;
    engineState.data.system.logging.filePath = null;
    engineState.data.system.logging.csv = {
      ok: false,
      active: false,
      filePath: null,
      lastWrite: null,
      reason: "CSV_DIRECTORY_NOT_FOUND"
    };
    engineState.data.system.logging.video = {
      ok: false,
      directory: videoDirectory || null,
      latestFile: null,
      latestWrite: null,
      reason: !videoDirectory ? "NOT_CONFIGURED" : "WAITING_FOR_VIDEO_FILES"
    };
    return () => {};
  }

  ensureLogDirectory(csvTargetDirectory);

  const fileName = `telemetry-${formatTimestamp(Date.now())}.csv`;
  const filePath = path.join(csvTargetDirectory, fileName);
  const stream = fs.createWriteStream(filePath, { flags: "a" });

  const header = [
    "timestamp_ms",
    "timestamp_iso",
    "timestamp_local",
    "pt1_ox_feed_psi",
    "pt2_ipa_tank_psi",
    "pt3_oxidizer_feed_psi",
    "pt4_fuel_pre_film_psi",
    "pt5_injector_manifold_psi",
    "pt6_nitrous_tank_psi",
    "tt1_throat_temp_f",
    "load_cell1_thrust_lbf",
    "load_cell2_tank_lb",
    "main_fuel_valve_mfv_state",
    "main_oxidizer_valve_mov_state",
    "tank_vent_valve_tvv_state",
    "oxidizer_fill_valve_ofv_state",
    "daq_online",
    "sequence_online",
    "sequence_code",
    "sequence_name",
    "sequence_time_in_state_sec",
    "sequence_plc_timer_sec",
    "sequence_register_offset",
    "tank_tare_lbf",
    "tank_full_lbf",
    "tank_fluid_lbf",
    "tank_fluid_max_lbf",
    "ignitor1_connected",
    "ignitor2_connected",
    "ignitor_continuity_ok",
    "faults"
  ].join(",") + "\n";
  stream.write(header);

  engineState.data.system.logging.active = true;
  engineState.data.system.logging.filePath = filePath;
  engineState.data.system.logging.csv = {
    ok: true,
    active: true,
    filePath,
    lastWrite: null,
    reason: "ACTIVE"
  };
  engineState.data.system.logging.video = {
    ok: false,
    directory: videoDirectory || null,
    latestFile: null,
    latestWrite: null,
    reason: videoDirectory ? "WAITING_FOR_VIDEO_FILES" : "NOT_CONFIGURED"
  };

  const interval = setInterval(() => {
    const row = buildRow(engineState.getState());
    stream.write(row);
    const now = Date.now();
    engineState.data.system.logging.lastWrite = now;
    engineState.data.system.logging.csv = {
      ...(engineState.data.system.logging.csv || {}),
      ok: true,
      active: true,
      filePath,
      lastWrite: now,
      reason: "ACTIVE"
    };
  }, intervalMs);

  let lastVideoPath = null;
  let lastVideoWrite = null;
  let lastVideoSize = null;
  let lastVideoProgressTs = 0;

  const videoMonitorInterval = setInterval(() => {
    const stateLogging = engineState.data.system.logging;
    const csvFileExists = Boolean(stateLogging.filePath && fs.existsSync(stateLogging.filePath));

    stateLogging.csv = {
      ...(stateLogging.csv || {}),
      ok: Boolean(stateLogging.active && csvFileExists),
      active: Boolean(stateLogging.active),
      filePath: stateLogging.filePath || null,
      lastWrite: stateLogging.lastWrite || null
    };

    if (!videoDirectory) {
      stateLogging.video = {
        ...(stateLogging.video || {}),
        ok: false,
        directory: null,
        latestFile: null,
        latestWrite: null,
        reason: "NOT_CONFIGURED"
      };
      return;
    }

    if (!fs.existsSync(videoDirectory)) {
      stateLogging.video = {
        ...(stateLogging.video || {}),
        ok: false,
        directory: videoDirectory,
        latestFile: null,
        latestWrite: null,
        reason: "DIRECTORY_NOT_FOUND"
      };
      return;
    }

    const latest = getLatestFileInfo(videoDirectory);
    if (!latest) {
      lastVideoPath = null;
      lastVideoWrite = null;
      lastVideoSize = null;
      lastVideoProgressTs = 0;
      stateLogging.video = {
        ...(stateLogging.video || {}),
        ok: false,
        directory: videoDirectory,
        latestFile: null,
        latestWrite: null,
        reason: "NO_VIDEO_FILES"
      };
      return;
    }

    const sameFile = latest.path === lastVideoPath;
    const writeChanged = latest.mtimeMs !== lastVideoWrite;
    const sizeChanged = latest.size !== lastVideoSize;
    if (!sameFile || writeChanged || sizeChanged) {
      lastVideoProgressTs = Date.now();
    }
    lastVideoPath = latest.path;
    lastVideoWrite = latest.mtimeMs;
    lastVideoSize = latest.size;

    const ageMs = Date.now() - (lastVideoProgressTs || latest.mtimeMs);
    const maxAgeMs = (videoRecentSec ?? 120) * 1000;
    const isRecent = ageMs <= maxAgeMs;

    stateLogging.video = {
      ...(stateLogging.video || {}),
      ok: Boolean(isRecent),
      directory: videoDirectory,
      latestFile: latest.path,
      latestWrite: latest.mtimeMs,
      reason: isRecent ? "ACTIVE" : "RECORDING_STOPPED_OR_STALLED"
    };
  }, 1000);

  return () => {
    clearInterval(interval);
    clearInterval(videoMonitorInterval);
    engineState.data.system.logging.active = false;
    engineState.data.system.logging.csv = {
      ...(engineState.data.system.logging.csv || {}),
      ok: false,
      active: false
    };
    stream.end();
  };
}

module.exports = { startDataLogger };
