import React from "react";

export default function StatusPanel({ batteries }) {
  const pct = Math.max(0, Math.min(100, ((batteries?.teensy ?? 12) / 12.6) * 100));

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>System Status</div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span>Controller Battery</span><span>{Math.round(pct)}%</span>
      </div>
      <div className="progress"><span style={{ width: `${pct}%` }} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <div className="tile">
          <div className="kicker">Controller</div>
          <div style={{ color: "var(--acc-1)", fontWeight: 700 }}>Teensy 4.1</div>
        </div>
        <div className="tile">
          <div className="kicker">Mode</div>
          <div style={{ color: "var(--acc-1)", fontWeight: 700 }}>Standby</div>
        </div>
      </div>
    </>
  );
}
