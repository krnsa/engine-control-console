import React from "react";

const ORDER = ["IDLE","FILL","CHILL","IGNITE","ABORT"];

/**
 * If inline=true, renders minimal chips (no card/panel).
 * Otherwise falls back to the previous card-style block.
 */
export default function InterlocksState({ mode="IDLE", onNext=()=>{}, inline=false }) {
  const idx = ORDER.indexOf(mode);
  const next = ORDER[(Math.max(idx, 0) + 1) % ORDER.length];

  if (inline) {
    return (
      <div className="hud-inline" aria-label="Interlocks State Machine">
        <span className="kicker" style={{marginRight:4}}>Interlocks</span>
        <div className="inline-chips">
          {ORDER.map((m,i)=>(
            <span key={m} className={`inline-chip ${i===idx?"ok": i<idx?"warn":"ghost"}`}>{m}</span>
          ))}
        </div>
        <button className="btn ghost" style={{padding:"6px 10px"}} onClick={()=>onNext(next)}>Advance</button>
      </div>
    );
  }

  // fallback: the original card layout
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Interlocks State Machine</div>
      <div className="tile" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        {ORDER.map((m,i)=>(
          <span key={m} className={`tag ${i===idx?"ok": i<idx?"warn":"ghost"}`}>{m}</span>
        ))}
        <div style={{flex:1}}/>
        <button className="btn ghost" onClick={()=>onNext(next)}>Advance</button>
      </div>
      <div className="kicker" style={{marginTop:8}}>Allowed transitions highlighted; ABORT is always reachable.</div>
    </>
  );
}
