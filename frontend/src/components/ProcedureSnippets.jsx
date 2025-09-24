import React from "react";

export default function ProcedureSnippets({ onSelect=()=>{} }) {
  const rows = [
    { key:"chill", label:"Perform Chill", desc:"Open chill valves, wait temp steady" },
    { key:"prepurge", label:"Pre-Ignition Purge", desc:"Purge lines for 5s" },
    { key:"post", label:"Post-Run Vent", desc:"Vent residuals to safe" },
  ];
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Procedure Snippets</div>
      <div style={{display:"grid",gap:10}}>
        {rows.map(r=>(
          <div key={r.key} className="tile" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div><strong>{r.label}</strong></div><div style={{opacity:.8,fontSize:12}}>{r.desc}</div></div>
            <button className="btn primary" onClick={()=>onSelect(r.label)}>Queue</button>
          </div>
        ))}
      </div>
    </>
  );
}
