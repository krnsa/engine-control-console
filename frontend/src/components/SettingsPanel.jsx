import React, { useState } from "react";
import { BACKEND_WS_URL } from "../engineSocket";

export default function SettingsPanel({ themeMode = "night", onThemeChange = () => {} }) {
  const [wsUrl, setWsUrl] = useState(BACKEND_WS_URL);
  const [units, setUnits] = useState("metric");
  const isDayMode = themeMode === "day";

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="conn-grid">
        <div className="section no-bg">
          <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Connection</div>
          <div className="conn-stack">
            <div className="conn-row" style={{ alignItems: "start" }}>
              <div style={{ display: "grid", gap: 8, width: "100%" }}>
                <span className="conn-label">WebSocket URL</span>
                <input
                  className="tile"
                  style={{ padding: "10px 12px", width: "100%" }}
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="conn-row">
              <div className="conn-detail">Connection settings are local placeholders for future persistence.</div>
              <span className="tag">LOCAL</span>
            </div>
          </div>
        </div>

        <div className="section no-bg">
          <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Theme</div>
          <div className="conn-stack">
            <div className="conn-row" style={{ alignItems: "center" }}>
              <div style={{ display: "grid", gap: 8, width: "100%" }}>
                <span className="conn-label">Display Mode</span>
                <div className="theme-toggle-row">
                  <button
                    type="button"
                    className={`theme-toggle ${isDayMode ? "day" : "night"}`}
                    onClick={() => onThemeChange(isDayMode ? "night" : "day")}
                    aria-label={`Switch to ${isDayMode ? "night" : "day"} mode`}
                    aria-pressed={isDayMode}
                  >
                    <span className="theme-toggle-track">
                      <span className="theme-toggle-icon moon" aria-hidden>☾</span>
                      <span className="theme-toggle-icon sun" aria-hidden>☀</span>
                      <span className="theme-toggle-thumb" />
                    </span>
                  </button>
                  <div className="theme-toggle-copy">
                    <div className="theme-toggle-title">{isDayMode ? "Day Mode" : "Night Mode"}</div>
                    <div className="conn-detail">
                      {isDayMode
                        ? "Bright high-visibility theme for daytime operations."
                        : "Current dark mission-control theme."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="conn-row">
              <div className="conn-detail">Night mode preserves the current look. Day mode remaps the full interface palette across all tabs.</div>
              <span className="tag">{isDayMode ? "DAY" : "NIGHT"}</span>
            </div>
          </div>
        </div>

        <div className="section no-bg">
          <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Units</div>
          <div className="conn-stack">
            <div className="conn-row" style={{ alignItems: "start" }}>
              <div style={{ display: "grid", gap: 8, width: "100%" }}>
                <span className="conn-label">Preferred Units</span>
                <select
                  className="tile"
                  style={{ padding: "10px 12px", width: "100%" }}
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                >
                  <option value="metric">Metric (C, bar, N)</option>
                  <option value="imperial">Imperial (F, psi, lbf)</option>
                </select>
              </div>
            </div>
            <div className="conn-row">
              <div className="conn-detail">Units are currently backend-fixed; this selector is staged for future support.</div>
              <span className="tag">STAGED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section no-bg">
        <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Calibration</div>
        <div className="conn-stack">
          <div className="conn-row">
            <span className="conn-label">Pressure Transducers / Load Cells / Valves</span>
            <span className="tag">PENDING</span>
          </div>
          <div className="conn-row">
            <div className="conn-detail">Calibration settings will be surfaced here once finalized.</div>
            <span className="tag">ROADMAP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
