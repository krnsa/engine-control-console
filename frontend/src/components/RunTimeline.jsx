import React from "react";

export default function RunTimeline({ timeline=[], onToggle=()=>{} }) {
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Run Timeline / Countdown</div>
      <div className="tile" style={{display:"flex",flexDirection:"column",gap:10}}>
        {timeline.map(t=>(
          <label key={t.key} style={{display:"flex",alignItems:"center",gap:10,justifyContent:"space-between"}}>
            <span style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" checked={!!t.done} onChange={()=>onToggle(t.key)} />
              <span>{t.label}</span>
            </span>
            <span className={`tag ${t.done?"ok":"warn"}`}>{t.done?"Done":"Pending"}</span>
          </label>
        ))}
      </div>
    </>
  );
}
