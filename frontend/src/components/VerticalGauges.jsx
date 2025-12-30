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

function SemiGauge({ label, value, unit, min = 0, max = 300, size = 140, stroke = 14, idx = 0 }) {
  const w = size;
  const h = Math.round(size * 0.5);
  const cx = w / 2;
  const cy = h;
  const r = w / 2 - stroke / 2 - 2;

  const safe = Number.isFinite(value) ? value : min;
  const v = Math.max(min, Math.min(max, safe));
  const pct = (v - min) / (max - min || 1);

  const epsilonDeg = 0.001;
  const endAngle = 180 - 180 * pct;
  const barPath = describeArc(cx, cy, r, 180, Math.max(endAngle, 180 - epsilonDeg));
  const trackPath = describeArc(cx, cy, r, 180, 0);

  const gradientId = `vg-grad-${idx}`;

  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 11, letterSpacing: 1, color: "#e5e7eb", marginBottom: 2, fontWeight: 600 }}>{label}</div>

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path d={trackPath} stroke="#374151" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {/* Value */}
        <path d={barPath} stroke={`url(#${gradientId})`} strokeWidth={stroke} fill="none" strokeLinecap="round" />

        {/* Percentage center */}
        <text x={cx} y={cy + 6} textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: "#ffffff" }}>
          {Math.round(pct * 100)}%
        </text>
      </svg>

      <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>
        <span style={{ fontWeight: 700, color: "#ffffff" }}>{Number.isFinite(value) ? value.toFixed(1) : "—"}</span>
        <span style={{ marginLeft: 6, color: "#9ca3af" }}>{unit}</span>
      </div>
    </div>
  );
}

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



