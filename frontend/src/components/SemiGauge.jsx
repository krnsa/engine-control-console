import React from "react";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function SemiGauge({
  label,
  value,
  unit = "",
  min = 0,
  max = 100,
  color = "#3b82f6", // blue like your screenshot
  size = 140,
}) {
  const safeValue = typeof value === "number" ? value : null;
  const ratio =
    safeValue === null ? 0 : clamp((safeValue - min) / (max - min), 0, 1);

  // Geometry
  const cx = size / 2;
  const r = Math.round(size / 2) - 16;
  const cy = r + 8; // TRUE center of the semicircle - KEEP THIS ONLY - Modifed Check Aditya - CC 

  const svgHeight = cy + 20;

  // Angle: left (-180°) → right (0°)
  const angle = -180 + ratio * 180;
  const radians = (angle * Math.PI) / 180;

  // Needle end
  const needleX = cx + Math.cos(radians) * (r - 10);
  const needleY = cy + Math.sin(radians) * (r - 10);

  // Arc endpoints
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;

  const arcLength = Math.PI * r;

  return (
    <div className="gauge-inline" aria-hidden={true} style={{ width: size }}>
      <div className="gauge-label">{label}</div>

      <svg
        width={size}
        height={svgHeight}
        viewBox={`0 0 ${size} ${svgHeight}`}
      >
        {/* Track */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${ratio * arcLength} ${arcLength}`}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3"
        />
        <circle cx={cx} cy={cy} r="4" fill={color} />

        {/* Center value */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="20"
          fontWeight="700"
        >
          {safeValue === null ? "--" : safeValue.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="11"
        >
          {unit}
        </text>
      </svg>
    </div>
  );
}
