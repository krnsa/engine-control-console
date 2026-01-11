import React from "react";

export default function BatteriesPanel({ batteries }) {
  const fmt = (value) => (typeof value === "number" ? `${value.toFixed(2)} V` : "-");

  const rows = [
    { key: "teensy", label: "Controller (Teensy)", value: batteries?.teensy },
    { key: "ljt7", label: "DAQ (LabJack T7)", value: batteries?.ljt7 },
    { key: "p_bus", label: "Sensor Bus", value: batteries?.sensors?.p_bus },
    { key: "tc_amp", label: "TC Amplifier", value: batteries?.sensors?.tc_amp },
    { key: "aux", label: "Aux Rail", value: batteries?.sensors?.aux }
  ];

  return (
    <div className="batt-panel">
      <div className="kicker" style={{ marginBottom: 12 }}>Battery Levels</div>
      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((r) => (
          <div className="battery-row" key={r.key}>
            <div className="battery-meta">
              <div className="battery-label">{r.label}</div>
              <div className="battery-val">{typeof r.value === "number" ? `${r.value.toFixed(2)} V` : `-`}</div>
            </div>
            <div className="battery-bar" aria-hidden>
              <span style={{ width: r.value ? `${Math.min(100, (r.value / 12) * 100)}%` : `0%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
