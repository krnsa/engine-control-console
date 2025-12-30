/**
 * Engine state container
 *
 * This object is the single source of truth for the engine
 * monitoring and control system.
 *
 * All subsystems (GUI, logging, safety) consume this state.
 */

const { checkLimits } = require("../safety/limits");
const { detectFaults } = require("../safety/faults");

const engineState = {
  data: {
    timestamp: null,

    pressures: {
      chamber: null,
      lox: null
    },

    thrust: {
      loadCell: null
    },

    valves: {
      mainValve: "UNKNOWN",
      ventValve: "UNKNOWN"
    },

    system: {
      daqOnline: false,
      lastUpdate: null
    },

    faults: []
  },

  initialize() {
    this.data.timestamp = Date.now();
    this.data.system.lastUpdate = null;
    console.log("[STATE] Engine state initialized");
  },

  updateDerived() {
    const limitFaults = checkLimits(this.data);
    const systemFaults = detectFaults(this.data);

    this.data.faults = [...limitFaults, ...systemFaults];
  },

  getState() {
    return this.data;
  }
};

module.exports = { engineState };
