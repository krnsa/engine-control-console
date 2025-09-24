import React from "react";

export default function TelemetryTiles({ pressures = [], tc = 0, nitrousFill=0, onOpenGraph=()=>{} }) {
  const items = [
    ...pressures.map((p, i) => ({
      key:`p${i}`, title:`Pressure ${i+1}`, value:Number(p ?? 0).toFixed(1), unit:"psi"
    })),
    { key:"tc", title:"Thermocouple", value:Number(tc ?? 0).toFixed(1), unit:"°C" },
    { key:"nitrous", title:"Nitrous Fill", value:Math.round((nitrousFill ?? 0)*100), unit:"%" },
  ];

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>Telemetry Data (click any tile)</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {items.map((it) => (
          <button
            key={it.key}
            className="tile"
            onClick={()=>onOpenGraph(it.key, it.title)}
            style={{ textAlign:"left", cursor:"pointer" }}
          >
            <div className="kicker">{it.title}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color:"var(--acc-1)" }}>
              {it.value}<span style={{ fontSize:12, marginLeft:6, color:"var(--txt-dim)" }}>{it.unit}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
