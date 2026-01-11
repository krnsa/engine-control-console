import React from "react";

export default function LogsPanel({ state }) {
  const logging = state?.system?.logging || {};
  const faults = Array.isArray(state?.faults) ? state.faults : [];

  return (
    <div className="grid-12">
      <div className="section col-span-6">
        <div className="kicker" style={{ marginBottom: 10 }}>Data Logging</div>
        <div className="tile" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Status</span>
            <span className={`tag ${logging.active ? "ok" : "bad"}`}>
              {logging.active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>File</span>
            <span className="mono" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>
              {logging.filePath ?? "--"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Last Write</span>
            <span className="mono">
              {logging.lastWrite ? new Date(logging.lastWrite).toLocaleTimeString() : "--"}
            </span>
          </div>
        </div>
      </div>

      <div className="section col-span-6">
        <div className="kicker" style={{ marginBottom: 10 }}>Faults</div>
        <div className="tile" style={{ display: "grid", gap: 10 }}>
          {faults.length ? (
            faults.map((fault, i) => (
              <div key={`${fault}-${i}`} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{fault}</span>
                <span className="tag bad">ACTIVE</span>
              </div>
            ))
          ) : (
            <div style={{ opacity: 0.7 }}>No active faults</div>
          )}
        </div>
      </div>

      <div className="section col-span-12">
        <div className="kicker" style={{ marginBottom: 10 }}>Event Stream</div>
        <div className="tile" style={{ minHeight: 160, opacity: 0.7 }}>
          Event stream placeholder. This will display timestamped log messages and operator notes.
        </div>
      </div>
    </div>
  );
}
