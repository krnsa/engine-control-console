import React from "react";

export default function VisualAnomalyHints({ hints=[] }) {
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Visual Anomaly Hints</div>
      <div style={{display:"grid",gap:10}}>
        {hints.map((h,i)=>(
          <div key={i} className="tile" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{h.label}</span>
            <span className={`tag ${h.status==="OK"?"ok":h.status==="Pending"?"warn":"bad"}`}>{h.status}</span>
          </div>
        ))}
        {hints.length===0 && <div className="tile">No hints yet. Add CV later to populate this.</div>}
      </div>
    </>
  );
}
