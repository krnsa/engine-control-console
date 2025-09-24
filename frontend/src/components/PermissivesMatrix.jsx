import React from "react";

export default function PermissivesMatrix({ items=[] }) {
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Arming & Permissives</div>
      <div style={{display:"grid",gap:10}}>
        {items.map(it=>(
          <div key={it.key} className="tile" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{it.label}</span>
            <span><span className={`dot ${it.ok?"ok":"bad"}`} /> <span className={`tag ${it.ok?"ok":"bad"}`}>{it.ok?"OK":"BLOCKING"}</span></span>
          </div>
        ))}
      </div>
    </>
  );
}
