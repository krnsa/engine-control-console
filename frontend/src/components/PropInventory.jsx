import React from "react";

export default function PropInventory({ inv={} }) {
  const { n2o_pct=0, fuel_pct=0, n2o_rate=0, fuel_rate=0, eta_min="--" } = inv;
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Prop Inventory</div>
      <div className="tile" style={{display:"grid",gap:10}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>N₂O Mass</span><span className="tag">{n2o_pct}%</span></div>
        <div className="progress"><span style={{width:`${n2o_pct}%`}}/></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Fuel Mass</span><span className="tag">{fuel_pct}%</span></div>
        <div className="progress"><span style={{width:`${fuel_pct}%`}}/></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Fill/Vent Rates</span><span className="mono">{n2o_rate} / {fuel_rate} kg/min</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>ETA to Target</span><span className="mono">{eta_min} min</span></div>
      </div>
    </>
  );
}
