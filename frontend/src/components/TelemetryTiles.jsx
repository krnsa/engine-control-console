import React from "react";

export default function TelemetryTiles({ pressures = [], tc = 0 }) {
  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>Telemetry Data</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {pressures.map((p, i) => (
          <div key={i} className="tile">
            <div className="kicker">Pressure {i + 1}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color:"var(--acc-1)" }}>{p.toFixed(1)}</div>
            <div className="kicker">psi</div>
          </div>
        ))}
        <div className="tile">
          <div className="kicker">Thermocouple</div>
          <div style={{ fontSize: 24, fontWeight: 900, color:"var(--acc-2)" }}>{tc.toFixed(1)}</div>
          <div className="kicker">°C</div>
        </div>
      </div>
    </>
  );
}
