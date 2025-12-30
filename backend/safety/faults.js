/**
 * Fault detection logic
 *
 * This module detects:
 *  - DAQ disconnects
 *  - Stale data conditions
 *
 * Faults generated here are intended for operator awareness
 * and test abort decision-making.
 */

const DATA_TIMEOUT_MS = 500; // Max allowable time between DAQ updates

function detectFaults(state) {
  const faults = [];

  const now = Date.now();

  // ---- DAQ OFFLINE ----
  if (!state.system.daqOnline) {
    faults.push("DAQ_OFFLINE");
    return faults;
  }

  // ---- STALE DATA ----
  if (state.system.lastUpdate !== null) {
    const age = now - state.system.lastUpdate;
    if (age > DATA_TIMEOUT_MS) {
      faults.push("DAQ_DATA_STALE");
    }
  }

  return faults;
}

module.exports = { detectFaults };
