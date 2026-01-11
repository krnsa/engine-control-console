import React, { useState } from "react";
import { BACKEND_WS_URL } from "../engineSocket";

export default function SettingsPanel() {
  const [wsUrl, setWsUrl] = useState(BACKEND_WS_URL);
  const [units, setUnits] = useState("metric");

  return (
    <div className="grid-12">
      <div className="section col-span-6">
        <div className="kicker" style={{ marginBottom: 10 }}>Connection</div>
        <div className="tile" style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>WebSocket URL</span>
            <input
              className="tile"
              style={{ padding: "10px 12px" }}
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
            />
          </label>
          <div style={{ opacity: 0.7, fontSize: 12 }}>
            Changing this does not persist yet; it is a placeholder for future settings storage.
          </div>
        </div>
      </div>

      <div className="section col-span-6">
        <div className="kicker" style={{ marginBottom: 10 }}>Units</div>
        <div className="tile" style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Preferred Units</span>
            <select
              className="tile"
              style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)" }}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            >
              <option value="metric">Metric (C, bar, N)</option>
              <option value="imperial">Imperial (F, psi, lbf)</option>
            </select>
          </label>
          <div style={{ opacity: 0.7, fontSize: 12 }}>
            Placeholder only. Units are currently fixed in the backend.
          </div>
        </div>
      </div>

      <div className="section col-span-12">
        <div className="kicker" style={{ marginBottom: 10 }}>Calibration</div>
        <div className="tile" style={{ opacity: 0.7 }}>
          Calibration settings will be surfaced here (pressure transducers, load cell, valves) once finalized.
        </div>
      </div>
    </div>
  );
}
