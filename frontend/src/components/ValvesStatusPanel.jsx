import React from "react";

/** Read-only valve state indicator card (compact + aligned) */
export default function ValvesStatusPanel({ valves = [] }) {
  const rows = [
    { label: "Main Fuel Valve (MFV)", idx: 0 },
    { label: "Main Oxidizer Valve (MOV)", idx: 1 },
    { label: "Tank Vent Valve (TVV)", idx: 2 },
    { label: "Oxidizer Fill Valve (OFV)", idx: 3 },
  ];

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>Valve Status</div>
      <div style={{ display:"grid", gap:12 }}>
        {rows.map(r => {
          const on = !!valves[r.idx];
          return (
            <div className="tile valve-row" key={r.idx}>
              <div className="valve-left">
                <div className="valve-label">{r.label}</div>
              </div>

              <div className="valve-right">
                <span className={`dot ${on ? "ok" : "bad"}`} />
                <span className={`tag pill-badge ${on ? "ok" : "bad"}`}>
                  {on ? "OPEN" : "CLOSED"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
