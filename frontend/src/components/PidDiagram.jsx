// Author: Aditya Sharma
// Rutgers Rocket Propulsion Laboratory

import React, { useState, useEffect } from "react";
import pidVectorSvg from "../../images/pid for vector.svg";

function fmt(value, unit) {
  if (typeof value !== "number") return "--";
  return `${value.toFixed(2)} ${unit}`;
}

function fmtPsi(value) {
  if (typeof value !== "number") return "--";
  return `${value.toFixed(3)} psi`;
}

function fmtTemp(value) {
  if (typeof value !== "number") return "--";
  return `${value.toFixed(2)} F`;
}

function isActive(value) {
  return typeof value === "number" && !Number.isNaN(value);
}

function getLoadCellSeverityClass(value, max) {
  if (typeof value !== "number" || Number.isNaN(value)) return "status-unknown";
  if (value < 0 || value >= max * 0.9) return "status-bad";
  if (value >= max * 0.75) return "status-warn";
  return "status-good";
}

export default function PidDiagram({ state, selectedKey = null, onSelect = () => {} }) {
  const sensors = state?.sensors || {};
  const tank = state?.system?.tank || {};
  const valves = state?.valves || {};

  const [zoomOpen, setZoomOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    document.body.style.overflow = zoomOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [zoomOpen]);

  const renderPidCanvas = (extraClass = "") => (
    <div className={`pid-canvas ${extraClass}`}>
      <img className="pid-base-image" src={pidVectorSvg} alt="P&ID diagram" />
      <div className="pid-schedule">
        <div className="pid-schedule-title">TRANSDUCER SCHEDULE</div>
        <div className="sched-item" onMouseEnter={() => setHovered("pt1")} onMouseLeave={() => setHovered(null)}>PT-1: OX FEED PRESSURE</div>
        <div className="sched-item" onMouseEnter={() => setHovered("pt2")} onMouseLeave={() => setHovered(null)}>PT-2: IPA TANK PRESSURE</div>
        <div className="sched-item" onMouseEnter={() => setHovered("pt3")} onMouseLeave={() => setHovered(null)}>PT-3: OXIDIZER FEED PRESSURE</div>
        <div className="sched-item" onMouseEnter={() => setHovered("pt4")} onMouseLeave={() => setHovered(null)}>PT-4: REGEN INLET PRESSURE</div>
        <div className="sched-item" onMouseEnter={() => setHovered("pt5")} onMouseLeave={() => setHovered(null)}>PT-5: FUEL PRESSURE (INJECTOR MANIFOLD)</div>
        <div className="sched-item" onMouseEnter={() => setHovered("pt6")} onMouseLeave={() => setHovered(null)}>PT-6: NITROUS TANK PRESSURE</div>
        <div className="sched-item" onMouseEnter={() => setHovered("tt1")} onMouseLeave={() => setHovered(null)}>TT-1: ENGINE THROAT TEMPERATURE</div>
      </div>
    </div>
  );

  const ptCards = [
    { key: "pt1", label: "PT-1", value: sensors.pt1 },
    { key: "pt2", label: "PT-2", value: sensors.pt2 },
    { key: "pt3", label: "PT-3", value: sensors.pt3 },
    { key: "pt4", label: "PT-4", value: sensors.pt4 },
    { key: "pt5", label: "PT-5", value: sensors.pt5 },
    { key: "pt6", label: "PT-6", value: sensors.pt6 }
  ];

  const valveCards = [
    { key: "mfv", label: "Main Fuel Valve (MFV)", value: valves.mfv },
    { key: "mov", label: "Main Oxidizer Valve (MOV)", value: valves.mov },
    { key: "tvv", label: "Tank Vent Valve (TVV)", value: valves.tvv },
    { key: "ofv", label: "Oxidizer Fill Valve (OFV)", value: valves.ofv }
  ];

  const loadCellCards = [
    { key: "loadCell1", label: "Load Cell 1", value: sensors.loadCell1, unit: "lbf", max: 2000 },
    { key: "loadCell2", label: "Load Cell 2", value: sensors.loadCell2, unit: "lbf", max: 220.46 },
    { key: "loadCell2Tare", label: "Load Cell 2 Tare", value: tank.tareWeightLbf, unit: "lbf", max: 220.46 }
  ];

  const thermoCard = { key: "tt1", label: "TT-1", value: sensors.tt1 };

  const renderSensorCard = (item) => (
    <div
      className={`pid-value ${hovered === item.key ? "hovered" : ""} ${selectedKey === item.key ? "selected" : ""} interactive`}
      key={item.label}
      onMouseEnter={() => setHovered(item.key)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(item.key)}
    >
      <div className="pid-tag-label">{item.label}</div>
      <div className={`pid-tag-value status ${isActive(item.value) ? "status-open" : "status-closed"}`}>
        {isActive(item.value) ? "OPEN" : "CLOSED"}
      </div>
      <div className="pid-tag-subvalue">{fmtPsi(item.value)}</div>
    </div>
  );

  const renderValveCard = (item) => {
    const v = typeof item.value === "string" ? item.value.toUpperCase() : "UNKNOWN";
    const statusClass = v === "OPEN" ? "status-open" : v === "CLOSED" ? "status-closed" : "status-unknown";
    return (
      <div className={`pid-value ${selectedKey === item.key ? "selected" : ""} interactive`} key={item.label} onClick={() => onSelect(item.key)}>
        <div className="pid-tag-label">{item.label}</div>
        <div className={`pid-tag-value status ${statusClass}`}>{v}</div>
      </div>
    );
  };

  const renderLoadCellCard = (item) => (
    <div className={`pid-value ${selectedKey === item.key ? "selected" : ""} interactive`} key={item.label} onClick={() => onSelect(item.key)}>
      <div className="pid-tag-label">{item.label}</div>
      <div className={`pid-tag-value status status-load ${getLoadCellSeverityClass(item.value, item.max)}`}>
        {fmt(item.value, item.unit)}
      </div>
    </div>
  );

  const renderThermoCard = (item) => (
    <div
      className={`pid-value ${hovered === item.key ? "hovered" : ""} ${selectedKey === item.key ? "selected" : ""} interactive`}
      key={item.label}
      onMouseEnter={() => setHovered(item.key)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(item.key)}
    >
      <div className="pid-tag-label">{item.label}</div>
      <div className={`pid-tag-value status ${isActive(item.value) ? "status-open" : "status-closed"}`}>
        {isActive(item.value) ? "OPEN" : "CLOSED"}
      </div>
      <div className="pid-tag-subvalue">{fmtTemp(item.value)}</div>
    </div>
  );

  return (
    <div className="pid-shell">
      <button className="pid-zoom-btn" onClick={() => setZoomOpen(true)} aria-label="Expand P&ID">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M21 3L13 11"/><path d="M9 21H3V15"/><path d="M3 21L11 13"/></svg>
      </button>
      {renderPidCanvas()}

      <div className="pid-status-stack">
        <div className="pid-status-row">{ptCards.map(renderSensorCard)}</div>
        <div className="pid-status-row">{valveCards.map(renderValveCard)}</div>
        <div className="pid-status-row">{[...loadCellCards.map(renderLoadCellCard), renderThermoCard(thermoCard)]}</div>
      </div>

      {zoomOpen && (
        <div className="pid-modal">
          <div className="pid-modal-inner">
            <div className="pid-modal-header">
              <div className="pid-title">P&ID (Zoom)</div>
              <button className="pid-modal-close" onClick={() => setZoomOpen(false)} aria-label="Close P&ID">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="pid-modal-body">
              {renderPidCanvas("zoom")}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
