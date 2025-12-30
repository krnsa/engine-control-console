// frontend/src/App.jsx
import React, { useState } from "react";
import "./App.css";
import "./index.css";

import GraphsPanel from "./components/GraphsPanel";

// You can swap these back to your real components later.
// For now we keep the same tab names you described.
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "connections", label: "Connections/Battery Status" },
  { key: "graphs", label: "Graphs" },
  { key: "cameras", label: "Cameras" },
  { key: "checklist", label: "Checklist" },
  { key: "logs", label: "Logs" },
  { key: "settings", label: "Settings" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("graphs"); // start on graphs while debugging

  return (
    <div className="app">
      <div className="top-controls" style={{ position: "relative", zIndex: 2000 }}>
        <div className="mission-title">MISSION CONTROL</div>

        <div className="tabbar" style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10 }}>
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: isActive ? "rgba(80, 170, 255, 0.18)" : "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {activeTab === "overview" && (
          <div className="panel">
            <div style={{ opacity: 0.8 }}>Overview placeholder (we’ll re-wire your P&amp;ID next)</div>
          </div>
        )}

        {activeTab === "connections" && (
          <div className="panel">
            <div style={{ opacity: 0.8 }}>Connections/Battery placeholder (we’ll clean this up next)</div>
          </div>
        )}

        {activeTab === "graphs" && (
          <div className="panel">
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.65, marginBottom: 12 }}>
              Graphs
            </div>
            <GraphsPanel />
          </div>
        )}

        {activeTab === "cameras" && <div className="panel">Cameras placeholder</div>}
        {activeTab === "checklist" && <div className="panel">Checklist placeholder</div>}
        {activeTab === "logs" && <div className="panel">Logs placeholder</div>}
        {activeTab === "settings" && <div className="panel">Settings placeholder</div>}
      </div>
    </div>
  );
}
