import React from "react";

export default function ValveMap({ valves=[] }) {
  const Dot = ({on}) => <span className={`dot ${on?"ok":"bad"}`} style={{margin:0}}/>;
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Valve Map</div>
      <div className="tile" style={{padding:16}}>
        {/* super-simple ASCII-ish schematic */}
        <div style={{fontFamily:"monospace",lineHeight:1.4}}>
{`Tank N₂O ----[ V1 ]----+----[ V2 ]---- Injector
                | 
              [ V3 ] (Vent)
                |
             Purge [ V4 ]`}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:12}}>
          <div className="tag"><Dot on={!!valves[0]}/> V1</div>
          <div className="tag"><Dot on={!!valves[1]}/> V2</div>
          <div className="tag"><Dot on={!!valves[2]}/> V3</div>
          <div className="tag"><Dot on={!!valves[3]}/> V4</div>
        </div>
      </div>
    </>
  );
}
