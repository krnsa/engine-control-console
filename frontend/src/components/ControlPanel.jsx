import React from "react";
import { FaBolt, FaExclamationTriangle, FaWind } from "react-icons/fa";

export default function ControlPanel({ valves = [], onToggle }) {
  const rows = [
    { name: "Main Propellant Valve", idx: 0 },
    { name: "Main Propellant Valve", idx: 1 },
    { name: "Vent Valve", idx: 2 },
    { name: "Purge/Aux Valve", idx: 3 },
  ];

  const onAbort = () => alert("ABORT sequence sent");
  const onIgnite = () => alert("IGNITE command sent");
  const onPurge  = () => alert("PURGE command sent");

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>Valve Controls</div>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.idx} className="tile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="kicker">{r.name}</div>
              <div style={{ fontWeight: 700 }}>Valve {r.idx + 1}</div>
            </div>
            <button
              className={`btn ${valves[r.idx] ? "primary" : "ghost"}`}
              onClick={() => onToggle?.(r.idx)}
              aria-pressed={!!valves[r.idx]}
            >
              {valves[r.idx] ? "OPEN" : "CLOSED"}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap:"wrap" }}>
        <button className="btn danger" onClick={onAbort} title="Abort sequence">
          <FaExclamationTriangle /> ABORT
        </button>
        <button className="btn primary" onClick={onIgnite} title="Ignition command">
          <FaBolt /> IGNITE
        </button>
        <button className="btn" onClick={onPurge} title="Purge line">
          <FaWind /> PURGE
        </button>
      </div>
    </>
  );
}
