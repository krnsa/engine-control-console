/**
 * System configuration for telemetry scaling and safety limits.
 * Keep this file as the single source of truth for calibration constants.
 */

const SYSTEM_CONFIG = {
  calibration: {
    pressureMaxPsi: {
      pt1: 2000,
      pt2: 2000,
      pt3: 2000,
      pt4: 2000,
      pt5: 2000,
      pt6: 2000
    },
    pressureZeroOffsetPsi: {
      pt1: -2.127,// S/N 8029012, zero 4.017 mA                // Used for the 
      pt2: -2.003,// S/N 8028976, zero 3.984 mA               // Used for the mfv 
      pt3: 5.502,  // S/N 8028939, zero 4.044 mA     
      pt4: -7.508, // S/N 8029080, zero 3.940 mA
      pt5: -4.006, // S/N 8028945, zero 3.968 mA
      pt6: -2.504  // S/N 8029051, zero 3.980 mA              // Used for the 
    },
    pressureSpanMa: {
      pt1: 15.981, // S/N 8029012, span mA
      pt2: 15.975, // S/N 8028976, span mA
      pt3: 15.992, // S/N 8028939, span mA
      pt4: 15.984, // S/N 8029080, span mA
      pt5: 15.975, // S/N 8028945, span mA
      pt6: 15.973  // S/N 8029051, span mA
    },
    pressureDeadbandPsi: 30,      // Deadband PSI = Set to 25 PSI - change to the offset provided by the system
    loadCell1LbfPerVolt: 1000,
    loadCell1MaxLb: 2000,
    loadCell1ZeroOffsetLb: -0.35, // for the offset Loads
    loadCell2LbPerVolt: 1000,
    loadCell2MaxLb: 220.46,
    loadCell2ZeroOffsetLb: -0.35, 
    temperatureFPerVolt: 500
  },

  logging: {
    directory: "./logs",
    intervalMs: 1
  },

  smoothing: {
    alpha: 0.1 // Smoothing factor for exponential moving average (0 < alpha <= 1) -- for now it is 0.2 but I want to test with 0.1
  },

  arduinoSerial: {
    port: "COM3",
    baudRate: 9600,
    maxEvents: 200
  },

  limits: {
    pressures: {
      pt1: { min: 0, max: 2000 },
      pt2: { min: 0, max: 2000 },
      pt3: { min: 0, max: 2000 },
      pt4: { min: 0, max: 2000 },
      pt5: { min: 0, max: 2000 },
      pt6: { min: 0, max: 2000 }
    },
    thrust: {
      loadCell1: { min: 0, max: 1000 }
    },
    weight: {
      loadCell2: { min: 0, max: 220.46 }
    },
    temperature: {
      tt1: { min: 0, max: 2500 }
    }
  }
};

module.exports = { SYSTEM_CONFIG };
