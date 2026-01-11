import React from "react";

// Improved tight vertical semicircle gauges.
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, start, end) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

import SemiGauge from "./SemiGauge";


export default function VerticalGauges({ size = 120, items = null }) {
  const defaultItems = [
    { label: "PRESSURE 1", value: 180.0, unit: "PSI" },
    { label: "PRESSURE 2", value: 175.0, unit: "PSI" },
    { label: "PRESSURE 3", value: 50.0, unit: "PSI" },
    { label: "PRESSURE 4", value: 120.0, unit: "PSI" },
    { label: "PRESSURE 5", value: 90.0, unit: "PSI" },
    { label: "PRESSURE 6", value: 200.0, unit: "PSI" },
    { label: "THERMOCOUPLE", value: 150.0, unit: "°C", max: 400 },
  ];

  const list = items || defaultItems;

  // No full-page background; compact column only
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }} aria-hidden={true}>
      {list.map((it, i) => (
        <SemiGauge key={i} idx={i} label={it.label} value={it.value} unit={it.unit} min={it.min ?? 0} max={it.max ?? (it.unit === "°C" ? 400 : 300)} size={size} />
      ))}
    </div>
  );
}



