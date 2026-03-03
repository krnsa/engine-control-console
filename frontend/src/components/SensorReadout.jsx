import React from "react";

function SensorVisual({ variant, pct }) {
  if (variant === "tank") {
    return (
      <div className="sensor-visual tank-shell" aria-hidden>
        <div className="tank-body">
          <div className="tank-fill" style={{ height: `${pct * 100}%` }} />
        </div>
      </div>
    );
  }

  if (variant === "thermo") {
    return (
      <div className="sensor-visual thermo-shell" aria-hidden>
        <div className="thermo-track">
          <div className="thermo-fill" style={{ height: `${pct * 100}%` }} />
          <div className="thermo-glow" style={{ bottom: `${pct * 100}%` }} />
        </div>
      </div>
    );
  }

  if (variant === "thrust") {
    return (
      <div className="sensor-visual thrust-shell" aria-hidden>
        <div className="thrust-bar">
          <div className="thrust-fill" style={{ width: `${pct * 100}%` }}>
            <span className="thrust-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <div className="progress" style={{ height: 8 }} aria-hidden>
        <span style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

export default function SensorReadout({ title, value, unit = "", max = null, variant = "bar" }) {
  const safe = typeof value === "number" ? value : null;
  const pct = max && safe !== null ? Math.max(0, Math.min(1, safe / max)) : 0;
  const isLarge = variant === "tank";

  return (
    <div className={`sensor-readout ${isLarge ? "sensor-readout-large" : ""}`}>
      <div className="kicker" style={{ marginBottom: 6, textAlign: "center" }}>{title}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <SensorVisual variant={variant} pct={pct} />

        <div style={{ minWidth: 84, textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{safe === null ? "--" : safe.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{unit}</div>
        </div>
      </div>
    </div>
  );
}
