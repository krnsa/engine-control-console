/**
 * Author: Aditya Sharma
 * Rutgers Rocket Propulsion Laboratory
 *
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
      pt1: null,
      pt2: null,
      pt3: null,
      pt4: null,
      pt5: null,
      pt6: null
    },

    thrust: {
      loadCell1: null
    },

    weight: {
      loadCell2: null
    },

    temperature: {
      tt1: null
    },

    sensors: {
      pt1: null,
      pt2: null,
      pt3: null,
      pt4: null,
      pt5: null,
      pt6: null,
      tt1: null,
      loadCell1: null,
      loadCell2: null
    },

    valves: {
      mainValve: "UNKNOWN",
      ventValve: "UNKNOWN"
    },

    system: {
      daqOnline: false,
      lastUpdate: null,
      wsClients: 0,
      cameras: {
        camera1: false,
        camera2: false,
        camera3: false
      },
      batteries: {
        teensy: null,
        ljt7: null,
        sensors: {
          p_bus: null,
          tc_amp: null,
          aux: null
        }
      },
      logging: {
        active: false,
        filePath: null,
        lastWrite: null
      }
    },

    faults: []
  },

  initialize() {
    this.data.timestamp = Date.now();
    this.data.system.lastUpdate = null;
    this.data.sensors = {
      pt1: null,
      pt2: null,
      pt3: null,
      pt4: null,
      pt5: null,
      pt6: null,
      tt1: null,
      loadCell1: null,
      loadCell2: null
    };
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
