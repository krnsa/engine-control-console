// Author: Aditya Sharma
// Rutgers Rocket Propulsion Laboratory

import React, { useState } from "react";
import SemiGauge from "./SemiGauge";
import SensorReadout from "./SensorReadout";
import PidDiagram from "./PidDiagram";

const PT_CONFIG = [
  { id: "pt1", label: "PT-1 Nitrous Tank", unit: "psi", min: 0, max: 2000, color: "#0ea5e9" },
  { id: "pt2", label: "PT-2 IPA Tank", unit: "psi", min: 0, max: 2000, color: "#f97316" },
  { id: "pt3", label: "PT-3 Ox Feed", unit: "psi", min: 0, max: 2000, color: "#22c55e" },
  { id: "pt4", label: "PT-4 Regen Inlet", unit: "psi", min: 0, max: 2000, color: "#eab308" },
  { id: "pt5", label: "PT-5 Injector Manifold", unit: "psi", min: 0, max: 2000, color: "#9ca3af" },
  { id: "pt6", label: "PT-6 Chamber", unit: "psi", min: 0, max: 2000, color: "#ef4444" }
];

const TEMP_UNITS = ["C", "K"];
const TEMP_MAX_F = 300;

function convertF(valueF, unit) {
  if (typeof valueF !== "number") return null;
  const c = (valueF - 32) * (5 / 9);
  if (unit === "C") return c;
  if (unit === "K") return c + 273.15;
  return valueF;
}

function ValueCard({ title, value, unit }) {
  const text = typeof value === "number" ? value.toFixed(1) : "--";
  return (
    <div className="tile" style={{ display: "grid", gap: 6 }}>
      <div className="kicker">{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {text} <span style={{ fontSize: 14, opacity: 0.7 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function OverviewPanel({ state }) {
  const [tempUnit, setTempUnit] = useState("C");
  const tt1Value = convertF(state?.sensors?.tt1, tempUnit);
  const tt1Max = convertF(TEMP_MAX_F, tempUnit);

  return (
    <div className="overview-grid">
      <div className="section overview-left no-bg">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="kicker" style={{ marginBottom: 10, textAlign: "center" }}>Pressure Transducers</div>
          <div className="overview-pt-stack" style={{ justifyItems: "center", alignItems: "center", justifyContent: "center" }}>
            {PT_CONFIG.map((pt) => (
              <SemiGauge
                key={pt.id}
                label={pt.label}
                value={state?.sensors?.[pt.id]}
                unit={pt.unit}
                min={pt.min}
                max={pt.max}
                color={pt.color}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="section overview-center no-bg">
        <div className="kicker" style={{ marginBottom: 10 }}>P&ID Diagram</div>
        <PidDiagram state={state} />
      </div>

      <div className="section overview-right no-bg">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="kicker" style={{ marginBottom: 12, textAlign: "center" }}>Load Cells</div>

          <div className="sensor-readouts" style={{ width: "100%", maxWidth: 320, display: "grid", gap: 12 }}>
            <SensorReadout title="Load Cell 1 (Thrust)" value={state?.sensors?.loadCell1} unit="lbf" max={2000} />
            <SensorReadout title="Load Cell 2 (Nitrous Tank)" value={state?.sensors?.loadCell2} unit="lb" max={1000} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 320 }}>
            <div className="kicker" style={{ marginTop: 18, marginBottom: 10, textAlign: "center" }}>Thermocouple</div>
            <select
              className="temp-unit-select"
              value={tempUnit}
              onChange={(e) => setTempUnit(e.target.value)}
              style={{ marginTop: 18, marginBottom: 10 }}
            >
              {TEMP_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          <div style={{ width: "100%", maxWidth: 320 }}>
            <SensorReadout title="TT-1 Throat Temp" value={tt1Value} unit={tempUnit} max={tt1Max} />
          </div>
        </div>
      </div>
    </div>
  );
}
