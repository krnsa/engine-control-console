import React from "react";

export default function CameraHealth({ cams={} }) {
  const rows = [
    { k:"a", label:"Camera A", v:cams.a||{} },
    { k:"b", label:"Camera B", v:cams.b||{} },
    { k:"c", label:"Camera C", v:cams.c||{} },
  ];
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Camera Health</div>
      <div style={{display:"grid",gap:10}}>
        {rows.map(r=>{
          const healthy = (r.v.drop??1) < 1.0;
          return (
            <div key={r.k} className="tile" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>{r.label}</span>
              <span style={{display:"flex",gap:8,alignItems:"center"}}>
                <span className="mono">FPS {r.v.fps ?? "--"}</span>
                <span className="mono">Drop {r.v.drop ?? "--"}%</span>
                <span className="mono">{r.v.temp ?? "--"}°C</span>
                <span className="mono">Last {r.v.last ?? "--"}</span>
                <span className={`tag ${healthy?"ok":"bad"}`}>{healthy?"OK":"ISSUES"}</span>
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
