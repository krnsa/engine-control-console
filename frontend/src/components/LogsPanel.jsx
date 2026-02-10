import React from "react";

export default function LogsPanel({ state }) {
  const logging = state?.system?.logging || {};
  const faults = Array.isArray(state?.faults) ? state.faults : [];
  const events = Array.isArray(state?.system?.eventStream) ? state.system.eventStream : [];
  const spares = state?.system?.spares || {};

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
        <div className="tile" style={{ minHeight: 160 }}>
          {events.length ? (
            <div style={{ display: "grid", gap: 6 }}>
              {[...events].reverse().map((e, i) => (
                <div key={`${e.ts}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="mono" style={{ opacity: 0.7, minWidth: 90 }}>
                    {new Date(e.ts).toLocaleTimeString()}
                  </span>
                  <span style={{ flex: 1 }}>{e.message}</span>
                  <span className={`tag ${e.level === "error" ? "bad" : e.level === "warn" ? "" : "ok"}`}>
                    {(e.source || "system").toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>No events yet</div>
          )}
        </div>
      </div>

      <div className="section col-span-12">
        <div className="kicker" style={{ marginBottom: 10 }}>Control I/O (Spare Lines)</div>
        <div className="tile" style={{ display: "grid", gap: 6 }}>
          {[
            { key: "spare1", label: "Arduino Command Out" },
            { key: "spare2", label: "PLC Command In" },
            { key: "spare3", label: "PLC Interlock OK" },
            { key: "spare4", label: "PLC Command Return" }
          ].map((item) => (
            <div key={item.key} style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="mono">{item.label}</span>
              <span>{spares[item.key] === null || spares[item.key] === undefined ? "--" : spares[item.key] ? "HIGH" : "LOW"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
