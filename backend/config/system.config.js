/**
 * System configuration for telemetry scaling and safety limits.
 * Keep this file as the single source of truth for calibration constants.
 */

const SYSTEM_CONFIG = {
  calibration: {
    pressureMaxPsi: {
      pt1: 1200,
      pt2: 400,
      pt3: 1200,
      pt4: 600,
      pt5: 500,
      pt6: 1000
    },
    loadCell1LbfPerVolt: 1000,
    loadCell2LbPerVolt: 1000,
    temperatureFPerVolt: 500
  },

  logging: {
    directory: "./logs",
    intervalMs: 100
  },

  limits: {
    pressures: {
      pt1: { min: 0, max: 1200 },
      pt2: { min: 0, max: 400 },
      pt3: { min: 0, max: 1200 },
      pt4: { min: 0, max: 600 },
      pt5: { min: 0, max: 500 },
      pt6: { min: 0, max: 1000 }
    },
    thrust: {
      loadCell1: { min: 0, max: 1000 }
    },
    weight: {
      loadCell2: { min: 0, max: 300 }
    },
    temperature: {
      tt1: { min: 0, max: 2500 }
    }
  }
};

module.exports = { SYSTEM_CONFIG };
