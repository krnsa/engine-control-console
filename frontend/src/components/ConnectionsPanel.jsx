import React from "react";

export default function ConnectionsPanel({ connections={} }) {
  const rows = [
    { key:"controller", label:"Controller" },
    { key:"sensors", label:"Sensors" },
    { key:"labjack", label:"LabJack T7" },
    { key:"camera1", label:"Camera A" },
    { key:"camera2", label:"Camera B" },
    { key:"camera3", label:"Camera C" },
    { key:"network", label:"Network" },
  ];

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>Connections</div>
      <div style={{ display:"grid", gap:10 }}>
        {rows.map(r => {
          const ok = !!connections[r.key];
          return (
            <div className="tile" key={r.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span><span className={`dot ${ok? "ok":"bad"}`} />{r.label}</span>
              <span className={`tag ${ok? "ok":"bad"}`}>{ok ? "Connected" : "Disconnected"}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
