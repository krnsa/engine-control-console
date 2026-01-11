// Author: Aditya Sharma
// Rutgers Rocket Propulsion Laboratory

import React, { useState, useEffect } from "react";

function fmt(value, unit) {
  if (typeof value !== "number") return "--";
  return `${value.toFixed(1)} ${unit}`;
}

function isActive(value) {
  return typeof value === "number" && value > 1;
}

export default function PidDiagram({ state }) {
  const sensors = state?.sensors || {};
  const valves = state?.valves || {};

  const n2oActive = isActive(sensors.pt1);
  const ipaActive = isActive(sensors.pt2);
  const oxActive = isActive(sensors.pt3);
  const fuelActive = isActive(sensors.pt4) || isActive(sensors.pt5);
  const chamberActive = isActive(sensors.pt6) || isActive(sensors.tt1);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  const hoverMap = {
    "PT-1": "pt1",
    "PT-2": "pt2",
    "PT-3": "pt3",
    "PT-4": "pt4",
    "PT-5": "pt5",
    "PT-6": "pt6",
    "TT-1": "tt1"
  };

  useEffect(() => {
    document.body.style.overflow = zoomOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [zoomOpen]);

  const renderSvg = (extraClass = "") => (
    <svg className={`pid-svg ${extraClass}`} viewBox="0 0 1400 860" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="1400" height="860" fill="none" />

      <g className="pid-line">
        <line className={`flow-n2o ${n2oActive ? "active" : ""}`} x1="210" y1="690" x2="460" y2="690" />
        <line className={`flow-n2o ${n2oActive ? "active" : ""}`} x1="460" y1="690" x2="460" y2="520" />
        <line className={`flow-n2o ${n2oActive ? "active" : ""}`} x1="460" y1="520" x2="610" y2="520" />
        <line className={`flow-n2o ${n2oActive ? "active" : ""}`} x1="610" y1="520" x2="610" y2="360" />
        <line className={`flow-n2o ${n2oActive ? "active" : ""}`} x1="610" y1="360" x2="860" y2="360" />

        <line className={`flow-ipa ${ipaActive ? "active" : ""}`} x1="620" y1="110" x2="620" y2="220" />
        <line className={`flow-ipa ${ipaActive ? "active" : ""}`} x1="620" y1="220" x2="860" y2="220" />
        <line className={`flow-ipa ${ipaActive ? "active" : ""}`} x1="860" y1="220" x2="1030" y2="220" />

        <line className={`flow-ox ${oxActive ? "active" : ""}`} x1="860" y1="360" x2="1030" y2="360" />

        <line className={`flow-fuel ${fuelActive ? "active" : ""}`} x1="1030" y1="220" x2="1030" y2="360" />
        <line className={`flow-fuel ${fuelActive ? "active" : ""}`} x1="1030" y1="220" x2="1180" y2="220" />

        <line className={`flow-chamber ${chamberActive ? "active" : ""}`} x1="1030" y1="300" x2="1180" y2="300" />
      </g>

      <g className="pid-vessels">
        <rect x="140" y="610" width="140" height="170" rx="70" />
        <rect x="350" y="400" width="260" height="120" rx="60" />
        <rect x="560" y="40" width="120" height="170" rx="55" />
      </g>

      <g className="pid-valves">
        <g className={`pid-valve ${valves.mainValve === "OPEN" ? "open" : valves.mainValve === "CLOSED" ? "closed" : ""}`}>
          <rect x="820" y="340" width="26" height="26" />
          <line x1="810" y1="340" x2="856" y2="366" />
          <line x1="810" y1="366" x2="856" y2="340" />
        </g>

        <g className={`pid-valve ${valves.ventValve === "OPEN" ? "open" : valves.ventValve === "CLOSED" ? "closed" : ""}`}>
          <rect x="600" y="220" width="26" height="26" />
          <line x1="590" y1="220" x2="636" y2="246" />
          <line x1="590" y1="246" x2="636" y2="220" />
        </g>
      </g>

      <g className="pid-equipment">
        <rect x="1160" y="250" width="170" height="110" rx="8" />
        <path d="M 1330 250 L 1385 305 L 1330 360 Z" />
      </g>

      <g className="pid-labels">
        <text x="160" y="810">NITROUS TANK</text>
        <text x="380" y="390">CONCENTRIC</text>
        <text x="380" y="410">PROPELLANT TANK</text>
        <text x="585" y="30">IPA TANK</text>
        <text x="1170" y="240">COMBUSTION CHAMBER</text>
        <text x="1340" y="300">NOZZLE</text>
        <text x="1020" y="210">IPA MAIN VALVE</text>
        <text x="860" y="340">NITROUS MAIN VALVE</text>
        <text x="270" y="520">NITROUS BLEED VALVE</text>
        <text x="240" y="560">NITROUS BURST DISC</text>
      </g>

<g className="pid-schedule" transform="translate(40,20)">
          <rect x="0" y="0" width="320" height="220" rx="8" />
          <text x="20" y="29">TRANSDUCER SCHEDULE</text>
          <text className="sched-item" x="20" y="59" onMouseEnter={() => setHovered('pt1')} onMouseLeave={() => setHovered(null)}>PT-1: NITROUS TANK PRESSURE</text>
          <text className="sched-item" x="20" y="84" onMouseEnter={() => setHovered('pt2')} onMouseLeave={() => setHovered(null)}>PT-2: IPA TANK PRESSURE</text>
          <text className="sched-item" x="20" y="109" onMouseEnter={() => setHovered('pt3')} onMouseLeave={() => setHovered(null)}>PT-3: OXIDIZER FEED PRESSURE</text>
          <text className="sched-item" x="20" y="134" onMouseEnter={() => setHovered('pt4')} onMouseLeave={() => setHovered(null)}>PT-4: FUEL PRESSURE (PRE-FILM COOLING)</text>
          <text className="sched-item" x="20" y="159" onMouseEnter={() => setHovered('pt5')} onMouseLeave={() => setHovered(null)}>PT-5: FUEL PRESSURE (INJECTOR MANIFOLD)</text>
          <text className="sched-item" x="20" y="184" onMouseEnter={() => setHovered('pt6')} onMouseLeave={() => setHovered(null)}>PT-6: COMBUSTION CHAMBER PRESSURE</text>
          <text className="sched-item" x="20" y="209" onMouseEnter={() => setHovered('tt1')} onMouseLeave={() => setHovered(null)}>TT-1: ENGINE THROAT TEMPERATURE</text>
      </g>

      <g className="pid-sensor">
          <circle cx="260" cy="600" r="18" className={hovered === 'pt1' ? 'hover' : ''} onMouseEnter={() => setHovered('pt1')} onMouseLeave={() => setHovered(null)} />
          <text x="260" y="604" onMouseEnter={() => setHovered('pt1')} onMouseLeave={() => setHovered(null)}>PT1</text>

          <circle cx="620" cy="130" r="18" className={hovered === 'pt2' ? 'hover' : ''} onMouseEnter={() => setHovered('pt2')} onMouseLeave={() => setHovered(null)} />
          <text x="620" y="134" onMouseEnter={() => setHovered('pt2')} onMouseLeave={() => setHovered(null)}>PT2</text>

          <circle cx="740" cy="520" r="18" className={hovered === 'pt3' ? 'hover' : ''} onMouseEnter={() => setHovered('pt3')} onMouseLeave={() => setHovered(null)} />
          <text x="740" y="524" onMouseEnter={() => setHovered('pt3')} onMouseLeave={() => setHovered(null)}>PT3</text>

          <circle cx="1030" cy="190" r="18" className={hovered === 'pt4' ? 'hover' : ''} onMouseEnter={() => setHovered('pt4')} onMouseLeave={() => setHovered(null)} />
          <text x="1030" y="194" onMouseEnter={() => setHovered('pt4')} onMouseLeave={() => setHovered(null)}>PT4</text>

          <circle cx="1120" cy="250" r="18" className={hovered === 'pt5' ? 'hover' : ''} onMouseEnter={() => setHovered('pt5')} onMouseLeave={() => setHovered(null)} />
          <text x="1120" y="254" onMouseEnter={() => setHovered('pt5')} onMouseLeave={() => setHovered(null)}>PT5</text>

          <circle cx="1120" cy="380" r="18" className={hovered === 'pt6' ? 'hover' : ''} onMouseEnter={() => setHovered('pt6')} onMouseLeave={() => setHovered(null)} />
          <text x="1120" y="384" onMouseEnter={() => setHovered('pt6')} onMouseLeave={() => setHovered(null)}>PT6</text>

          <circle cx="1260" cy="380" r="18" className={hovered === 'tt1' ? 'hover' : ''} onMouseEnter={() => setHovered('tt1')} onMouseLeave={() => setHovered(null)} />
          <text x="1260" y="384" onMouseEnter={() => setHovered('tt1')} onMouseLeave={() => setHovered(null)}>TT1</text>
      </g>
    </svg>
  );

  return (
    <div className="pid-shell">
      <button className="pid-zoom-btn" onClick={() => setZoomOpen(true)} aria-label="Expand P&ID">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M21 3L13 11"/><path d="M9 21H3V15"/><path d="M3 21L11 13"/></svg>
      </button>
      {renderSvg()}

      <div className="pid-values pid-status-row">
        {[
          { label: "PT-1", value: sensors.pt1 },
          { label: "PT-2", value: sensors.pt2 },
          { label: "PT-3", value: sensors.pt3 },
          { label: "PT-4", value: sensors.pt4 },
          { label: "PT-5", value: sensors.pt5 },
          { label: "PT-6", value: sensors.pt6 },
          { label: "TT-1", value: sensors.tt1 },
          { label: "Load Cell 1", value: sensors.loadCell1 },
          { label: "Load Cell 2", value: sensors.loadCell2 },
          { label: "Main Valve", value: valves.mainValve },
          { label: "Vent Valve", value: valves.ventValve }
        ].map((item) => {
          const isSensor = typeof item.value === "number";
          const hoverKey = hoverMap[item.label];
          let statusText = "CLOSED";
          let statusClass = "status-closed";

          if (isSensor) {
            if (isActive(item.value)) {
              statusText = "OPEN";
              statusClass = "status-open";
            }
          } else if (typeof item.value === "string") {
            const v = item.value.toUpperCase();
            if (v === "OPEN") { statusText = "OPEN"; statusClass = "status-open"; }
            else if (v === "CLOSED") { statusText = "CLOSED"; statusClass = "status-closed"; }
            else { statusText = v; statusClass = "status-unknown"; }
          }

          return (
            <div
              className={`pid-value ${hoverKey && hovered === hoverKey ? 'hovered' : ''} ${hoverKey ? 'interactive' : ''}`}
              key={item.label}
              onMouseEnter={hoverKey ? () => setHovered(hoverKey) : undefined}
              onMouseLeave={hoverKey ? () => setHovered(null) : undefined}
            >
              <div className="pid-tag-label">{item.label}</div>
              <div className={`pid-tag-value status ${statusClass}`}>{statusText}</div>
            </div>
          );
        })}
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
              {renderSvg('zoom')}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
