/**
 * Engine safety limits
 *
 * This module performs read-only evaluation of live engine data.
 * No actuation or command authority exists here.
 *
 * Faults raised by this module are intended for:
 *  - Operator awareness
 *  - Test abort decision support
 *  - Post-test data review
 */

const LIMITS = {
  pressures: {
    chamber: { min: 0, max: 1200 }, // psi
    lox: { min: 0, max: 800 }       // psi
  },

  thrust: {
    loadCell: { min: -50, max: 5000 } // lbf
  }
};

function checkLimits(state) {
  const faults = [];

  // Pressure checks
  for (const key in LIMITS.pressures) {
    const value = state.pressures?.[key];
    if (value === null || value === undefined) continue;

    const { min, max } = LIMITS.pressures[key];
    if (value < min || value > max) {
      faults.push(`PRESSURE_${key.toUpperCase()}_OUT_OF_LIMIT`);
    }
  }

  // Thrust checks
  for (const key in LIMITS.thrust) {
    const value = state.thrust?.[key];
    if (value === null || value === undefined) continue;

    const { min, max } = LIMITS.thrust[key];
    if (value < min || value > max) {
      faults.push(`THRUST_${key.toUpperCase()}_OUT_OF_LIMIT`);
    }
  }

  return faults;
}

module.exports = { checkLimits };
