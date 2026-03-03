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
      pt4: -7.508, // S/N 8029080, zero 3.940 mA //-7.508 original
      pt5: -4.006, // S/N 8028945, zero 3.968 mA
      pt6: -2.504  // S/N 8029051, zero 3.980 mA              // Used for the 
    },
    pressureZeroMa: {
      pt1: 4.017,
      pt2: 3.984,
      pt3: 4.044,
      pt4: 3.940,
      pt5: 3.968,
      pt6: 3.980
    },
    pressureSpanMa: {
      pt1: 15.981, // S/N 8029012, span mA
      pt2: 15.975, // S/N 8028976, span mA
      pt3: 15.992, // S/N 8028939, span mA
      pt4: 15.984, // S/N 8029080, span mA
      pt5: 15.975, // S/N 8028945, span mA
      pt6: 15.973  // S/N 8029051, span mA
    },
    pressureDeadbandPsi: 0,      // Deadband PSI = Set to 25 PSI - change to the offset provided by the system // Was 30 changed to 3
    loadCell1LbfPerVolt: 1000,
    loadCell1MaxLb: 2000,
    loadCell1ZeroOffsetLb: 0,
    loadCell1MinMa: 3.5,
    loadCell1MaxMa: 20.8,
    loadCell1DeadbandLb: 1.0,
    loadCell2LbPerVolt: 1000,
    loadCell2MaxLb: 220.46,
    loadCell2ZeroOffsetLb: 0,
    temperatureMinF: 0,                    // based on transmitter range and expected test conditions
    temperatureMaxF: 1000,                // based on transmitter range and expected test conditions
    temperatureZeroMa: 4,
    temperatureSpanMa: 16
  },

  sensors: {
    // Set true only when the corresponding sensor/transmitter wiring is complete.
    availability: {
      loadCell1: false,
      loadCell2: true, // set to false before
      tt1: true
    }
  },

  plcSequence: {
    enabled: true,
    host: "192.168.1.1",                          // Correct HOST - Aditya Verfied 
    port: 502,                                                                    // PORT 502 Check - PLC - CONFIRMED 
    unitId: 1,
    pollMs: 500,                                           // NEED TO CHANGE SAM - PLC MANUALLY // IT WONT WORK THEN - CHANGE 500 to 100 Ms Rate 
    timeoutMs: 1000,
    // Use Input Registers (3xxxx, read-only)
    registerType: "input",
    // 30001 -> address 0 (N7:0)
    stateRegister: 0,
    // 30002 -> address 1 (N7:1)
    timerRegister: 1,
    timerSigned: true,
    // Lock Modbus address base. 0 means use configured offsets as-is.
    fixedRegisterOffset: 0,
    // Debug register dump (raw uint16 values)
    debugDumpRegisters: false,
    debugDumpStartRegister: 0,
    debugDumpCount: 16,
    // Tank model from PLC registers (int16 scaled by divisor).
    // tare register: tank weight after tare
    // full register: desired full tank weight
    // nitrous in system = loadCell2 - tare
    // tank graph max = (full - tare) * maxMultiplier
    tankModel: {
      enabled: true,
      tareRegister: 1,
      fullRegister: 2,
      signed: true,
      scaleDivisor: 100,
      maxMultiplier: 1.2
    },
    // Ignitor continuity from PLC/Modbus.
    // Raw false/0 = connected, true/1 = disconnected.
    ignitorContinuity: {
      enabled: true,
      // 1xxxx Modbus discrete-input addresses from PLC map.
      ignitor1Register: 10465,
      ignitor2Register: 10466,
      trueMeansDisconnected: true
    },
    states: {
      0: "Manual Control",
      100: "Default State",
      200: "Systems Check Waiting",
      250: "Systems Check Running",
      290: "Tank Scale Tare",
      300: "Initial Nitrous Fill",
      310: "Nitrous Pulsing",
      320: "Nitrous Bleeding",
      350: "Nitrous Filling Complete",
      400: "Fire Engine",
      500: "Shutdown",
      800: "Process Stop",
      900: "Reset"
    }
  },

  logging: {
    directory: "./logs",
    // Locked CSV target on SD card.
    csvDirectory: "D:/Test Data",
    intervalMs: 1,
    // Locked camera/video target on SD card (MediaMTX recordPath root).
    videoDirectory: "D:/Recordings",
    // If true, logger refuses to start unless locked SD card folders exist.
    strictExternalPaths: true,
    // How recent a video file write must be to be considered actively recording.
    videoRecentSec: 6
  },

  smoothing: {
    alpha: 0.1, // Global EMA smoothing factor (0 < alpha <= 1)
    // Per-channel overrides for noisy signals.
    // Lower alpha = more smoothing, more lag.
    perChannelAlpha: {
      pt2: 0.04
    }
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
      loadCell1: { min: 0, max: 2000 }
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
