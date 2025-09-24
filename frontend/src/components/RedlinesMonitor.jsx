import React from "react";

export default function RedlinesMonitor({ limits=[] }) {
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Redlines Monitor</div>
      <div style={{display:"grid",gap:10}}>
        {limits.map(l=>{
          const over = Number(l.value) >= Number(l.limit);
          const pct = Math.min(100, Math.max(0, (Number(l.value)/Number(l.limit))*100));
          return (
            <div key={l.key} className="tile">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <strong>{l.label}</strong>
                <span className={`tag ${over?"bad":"ok"}`}>{Number(l.value).toFixed(1)} {l.unit} / {l.limit} {l.unit}</span>
              </div>
              <div className="progress"><span style={{width:`${pct}%`}}/></div>
            </div>
          );
        })}
      </div>
    </>
  );
}
