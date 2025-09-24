import React from "react";

export default function BatteriesPanel({ batteries }) {
  const rows = [
    { label: "Controller (Teensy)", value: (batteries?.teensy ?? 0).toFixed(1) + " V" },
    { label: "DAQ (LabJack T7)", value: (batteries?.ljt7 ?? 0).toFixed(1) + " V" },
    { label: "Sensor Bus", value: (batteries?.sensors?.p_bus ?? 0).toFixed(1) + " V" },
    { label: "TC Amplifier", value: (batteries?.sensors?.tc_amp ?? 0).toFixed(1) + " V" },
    { label: "Aux Rail", value: (batteries?.sensors?.aux ?? 0).toFixed(1) + " V" },
  ];

  return (
    <>
      <div className="kicker" style={{ marginBottom: 10 }}>Battery Levels</div>
      <div style={{ display:"grid", gap:10 }}>
        {rows.map((r, i) => (
          <div className="tile" key={i} style={{ display:"flex", justifyContent:"space-between" }}>
            <span>{r.label}</span>
            <span className="mono" style={{ color:"var(--acc-1)", fontWeight:700 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
