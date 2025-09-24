import React, { useState } from "react";

export default function ChecklistCard() {
  const [items, setItems] = useState([
    { k:"leak", label:"Leak check complete", done:false },
    { k:"igniter", label:"Igniter continuity OK", done:false },
    { k:"cams", label:"Cameras set & recording", done:false },
    { k:"shields", label:"Shields in place", done:false },
  ]);
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Checklist</div>
      <div className="tile" style={{display:"grid",gap:8}}>
        {items.map(i=>(
          <label key={i.k} style={{display:"flex",alignItems:"center",gap:10,justifyContent:"space-between"}}>
            <span style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" checked={i.done} onChange={()=>setItems(s=>s.map(x=>x.k===i.k?{...x,done:!x.done}:x))}/>
              <span>{i.label}</span>
            </span>
            <span className={`tag ${i.done?"ok":"warn"}`}>{i.done?"OK":"TODO"}</span>
          </label>
        ))}
      </div>
    </>
  );
}
