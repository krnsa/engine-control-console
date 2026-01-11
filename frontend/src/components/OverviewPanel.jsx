// Author: Aditya Sharma
// Rutgers Rocket Propulsion Laboratory

import React from "react";
import SemiGauge from "./SemiGauge";
import SensorReadout from "./SensorReadout";
import PidDiagram from "./PidDiagram";

const PT_CONFIG = [
  { id: "pt1", label: "PT-1 Nitrous Tank", unit: "psi", min: 0, max: 1200, color: "#0ea5e9" },
  { id: "pt2", label: "PT-2 IPA Tank", unit: "psi", min: 0, max: 400, color: "#f97316" },
  { id: "pt3", label: "PT-3 Ox Feed", unit: "psi", min: 0, max: 1200, color: "#22c55e" },
  { id: "pt4", label: "PT-4 Fuel Pre-Film", unit: "psi", min: 0, max: 600, color: "#eab308" },
  { id: "pt5", label: "PT-5 Injector Manifold", unit: "psi", min: 0, max: 500, color: "#9ca3af" },
  { id: "pt6", label: "PT-6 Chamber", unit: "psi", min: 0, max: 1000, color: "#ef4444" }
];

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

          <div className="kicker" style={{ marginTop: 18, marginBottom: 10, textAlign: "center" }}>Thermocouple</div>
          <div style={{ width: "100%", maxWidth: 320 }}>
            <SensorReadout title="TT-1 Throat Temp" value={state?.sensors?.tt1} unit="F" max={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
