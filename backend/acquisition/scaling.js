/**
 * Sensor scaling and normalization layer
 * Author: Aditya Sharma
 * Rutgers Rocket Propulsion Laboratory
 * This file converts raw DAQ readings into engineering units.
 * All scaling functions are deterministic and side-effect free.
 *
 * Any value returning `null` is considered invalid and should
 * trigger fault handling upstream.
 */

// Pressure transducer scaling (4-20 mA via shunt resistor)
// Electrical: 0.996-4.98 V observed across 249 ohm shunt
// Engineering units: PSI
function scalePressurePsi(voltage, maxPsi, zeroOffsetPsi = 0, spanMa = 16) {
  const V_MIN = 0.996;
  const V_MAX = 4.98;

  if (typeof voltage !== "number") return null;
  if (voltage < V_MIN || voltage > V_MAX) return null;

  const ma = (voltage / 249) * 1000;
  const psi = ((ma - 4) / spanMa) * maxPsi + zeroOffsetPsi;
  // Clamp tiny negative values after offset to zero.
  return psi > 0 ? psi : 0;

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
