import React from "react";
import { WiStrongWind, WiBarometer } from "react-icons/wi";
import { LuThermometer, LuDroplets } from "react-icons/lu";

/**
 * Compact pill-style environment bar.
 * Renders as a single-row chip group with icons and values.
 * This sits inside the fixed .pad-float container defined in App.css.
 */
export default function PadEnvironment({ env = {} }) {
  const {
    temp = "--",
    wind = "--",
    humidity = "--",
    pressure = "--",
    crosswind_ok = true,
  } = env;

  return (
    <div className="envbar glass">
      <div className="env-chip">
        <LuThermometer size={16} />
        <span className="label">Ambient</span>
        <span className="value">{temp}°C</span>
      </div>

      <div className="env-chip">
        <WiStrongWind size={18} />
        <span className="label">Wind</span>
        <span className="value">{wind} m/s</span>
      </div>

      <div className="env-chip">
        <LuDroplets size={16} />
        <span className="label">Humidity</span>
        <span className="value">{humidity}%</span>
      </div>

      <div className="env-chip">
        <WiBarometer size={18} />
        <span className="label">Baro</span>
        <span className="value">{pressure} hPa</span>
      </div>

      <div className={`env-chip ${crosswind_ok ? "ok" : "bad"}`}>
        <span className={`dot ${crosswind_ok ? "ok" : "bad"}`} />
        <span className="label">Cross-wind</span>
        <span className="value">{crosswind_ok ? "OK" : "High"}</span>
      </div>
    </div>
  );
}
