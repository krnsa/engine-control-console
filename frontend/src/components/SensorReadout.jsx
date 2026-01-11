import React from "react";

export default function SensorReadout({ title, value, unit = "", max = null, showPercent = true }) {
  const safe = typeof value === "number" ? value : null;
  const pct = max && safe !== null ? Math.max(0, Math.min(1, safe / max)) : null;

  return (
    <div className="sensor-readout">
      <div className="kicker" style={{ marginBottom: 6, textAlign: "center" }}>{title}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="progress" style={{ height: 8 }} aria-hidden>
            <span style={{ width: pct ? `${pct * 100}%` : "0%" }} />
          </div>
        </div>

        <div style={{ minWidth: 84, textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{safe === null ? "--" : safe.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{unit}</div>
        </div>
      </div>
    </div>
  );
}
