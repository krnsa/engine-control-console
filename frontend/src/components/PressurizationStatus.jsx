import React from "react";

export default function PressurizationStatus({ press={} }) {
  const { he_bottle=0, regulator=0, target=0, est_sec="--" } = press;
  const pct = Math.min(100, Math.max(0, (regulator/target)*100));
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Pressurization Status</div>
      <div className="tile" style={{display:"grid",gap:8}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Bottle</span><span className="mono">{he_bottle} psi</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Regulator</span><span className="mono">{regulator} psi</span></div>
        <div className="progress"><span style={{width:`${pct}%`}}/></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Target</span><span className="mono">{target} psi</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Est. Time Remaining</span><span className="mono">{est_sec} s</span></div>
      </div>
    </>
  );
}
