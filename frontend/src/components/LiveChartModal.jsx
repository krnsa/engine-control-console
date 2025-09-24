import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area } from "recharts";

export default function LiveChartModal({ title, series=[], units="", onClose }){
  const view = series.map(d => ({ time:d.t, value:d.y }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="kicker">Live Graph</div>
            <h2 style={{ margin:0 }}>{title}{units ? ` (${units})` : ""}</h2>
          </div>
          <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view}>
              <CartesianGrid stroke="rgba(255,255,255,.12)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(t)=>new Date(t).toLocaleTimeString()} stroke="rgba(255,255,255,.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,.5)" fontSize={12} label={{ value:units, angle:-90, position:"insideLeft", fill:"rgba(255,255,255,.6)" }} />
              <Tooltip contentStyle={{ background:"rgba(12,16,24,.92)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12 }} labelFormatter={(t)=>new Date(t).toLocaleTimeString()} />
              <defs>
                <linearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12b3ff" stopOpacity={0.65} />
                  <stop offset="100%" stopColor="#12b3ff" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#12b3ff" strokeWidth={3} fill="url(#miniFill)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
