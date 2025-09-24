import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from "recharts";

export default function ThrustChart({ data = [], latest = 0 }) {
  const view = Array.isArray(data) ? data.map((d) => ({ time: d.t, thrust: d.y })) : [];

  return (
    <>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div className="kicker">Thrust Profile</div>
        <div className="mono" style={{ color:"var(--acc-1)", fontWeight:700 }}>{Number(latest ?? 0).toFixed(1)} lbf</div>
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={view}>
            <CartesianGrid stroke="rgba(255,255,255,.12)" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              stroke="rgba(255,255,255,.5)"
              fontSize={12}
            />
            <YAxis
              stroke="rgba(255,255,255,.5)"
              fontSize={12}
              label={{ value:"lbf", angle:-90, position:"insideLeft", fill:"rgba(255,255,255,.6)" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background:"rgba(12,16,24,.92)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12 }}
              labelFormatter={(t)=> new Date(t).toLocaleTimeString()}
            />
            <defs>
              <linearGradient id="thrustFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12b3ff" stopOpacity={0.65} />
                <stop offset="100%" stopColor="#12b3ff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="thrust" stroke="#12b3ff" strokeWidth={3} fill="url(#thrustFill)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
