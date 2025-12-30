/**
 * Sensor scaling and normalization layer
 *
 * This file converts raw DAQ readings into engineering units.
 * All scaling functions are deterministic and side-effect free.
 *
 * Any value returning `null` is considered invalid and should
 * trigger fault handling upstream.
 */

// Pressure transducer scaling
// Hardware: ratiometric pressure transducers
// Electrical: 0.5–4.5 V output
// Engineering units: PSI
function scalePressurePsi(voltage, maxPsi) {
  const V_MIN = 0.5;
  const V_MAX = 4.5;

  if (typeof voltage !== "number") return null;
  if (voltage < V_MIN || voltage > V_MAX) return null;

  return ((voltage - V_MIN) / (V_MAX - V_MIN)) * maxPsi;
}

// Load cell thrust scaling
// Input assumed to be conditioned analog voltage
// Output is thrust in pounds-force (lbf)
// Calibration factor must match test stand calibration sheet
function scaleThrustLbf(voltage, calibrationFactor) {
  if (typeof voltage !== "number") return null;
  return voltage * calibrationFactor;
}

// Valve feedback normalization
// Digital feedback from limit switches or position sensors
function scaleValveState(rawValue) {
  if (rawValue === "OPEN") return "OPEN";
  if (rawValue === "CLOSED") return "CLOSED";
  return "UNKNOWN";
}

module.exports = {
  scalePressurePsi,
  scaleThrustLbf,
  scaleValveState
};
