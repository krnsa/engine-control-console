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

const { SYSTEM_CONFIG } = require("../config/system.config");

const LIMITS = SYSTEM_CONFIG.limits;

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

  // Weight checks
  if (LIMITS.weight) {
    for (const key in LIMITS.weight) {
      const value = state.weight?.[key];
      if (value === null || value === undefined) continue;

      const { min, max } = LIMITS.weight[key];
      if (value < min || value > max) {
        faults.push(`WEIGHT_${key.toUpperCase()}_OUT_OF_LIMIT`);
      }
    }
  }

  // Temperature checks
  if (LIMITS.temperature) {
    for (const key in LIMITS.temperature) {
      const value = state.temperature?.[key];
      if (value === null || value === undefined) continue;

      const { min, max } = LIMITS.temperature[key];
      if (value < min || value > max) {
        faults.push(`TEMP_${key.toUpperCase()}_OUT_OF_LIMIT`);
      }
    }
  }

  return faults;
}

module.exports = { checkLimits };
