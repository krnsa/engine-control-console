// Author: Aditya Sharma
// Rutgers Rocket Propulsion Laboratory

import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";
import SemiGauge from "./SemiGauge";
import SensorReadout from "./SensorReadout";
import PidDiagram from "./PidDiagram";
import TankCard from "./TankCard";
import ThermocoupleSelectedPanel from "./ThermocoupleSelectedPanel";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const PT_CONFIG = [
  { id: "pt1", label: "PT-1 Ox Feed", unit: "psi", min: 0, max: 2000, color: "#0ea5e9" },
  { id: "pt2", label: "PT-2 IPA Tank", unit: "psi", min: 0, max: 2000, color: "#f97316" },
  { id: "pt3", label: "PT-3 Ox Feed", unit: "psi", min: 0, max: 2000, color: "#22c55e" },
  { id: "pt4", label: "PT-4 Regen Inlet", unit: "psi", min: 0, max: 2000, color: "#eab308" },
  { id: "pt5", label: "PT-5 Injector Manifold", unit: "psi", min: 0, max: 2000, color: "#9ca3af" },
  { id: "pt6", label: "PT-6 Nitrous Tank", unit: "psi", min: 0, max: 2000, color: "#ef4444" }
];

const TANK_GAUGE_MIN_LBF = 0;
const TANK_GAUGE_MAX_LBF = 100;
const MAX_TREND_POINTS = 160;
const SEQUENCE_STATES = [
  { code: 0, name: "Manual Control" },
  { code: 100, name: "Default State" },
  { code: 200, name: "Systems Check Waiting" },
  { code: 250, name: "Systems Check Running" },
  { code: 290, name: "Tank Scale Tare" },
  { code: 300, name: "Initial Nitrous Fill" },
  { code: 310, name: "Nitrous Pulsing" },
  { code: 320, name: "Nitrous Bleeding" },
  { code: 350, name: "Nitrous Filling Complete" },
  { code: 400, name: "Fire Engine" },
  { code: 500, name: "Shutdown" },
  { code: 800, name: "Process Stop" },
  { code: 900, name: "Reset" }
];
const SIGNAL_META = {
  pt1: { title: "PT-1 Ox Feed", unit: "psi", source: "AIN0", kind: "analog", color: "#38bdf8" },
  pt2: { title: "PT-2 IPA Tank", unit: "psi", source: "AIN1", kind: "analog", color: "#fb923c" },
  pt3: { title: "PT-3 Oxidizer Feed", unit: "psi", source: "AIN2", kind: "analog", color: "#4ade80" },
  pt4: { title: "PT-4 Regen Inlet", unit: "psi", source: "AIN3", kind: "analog", color: "#facc15" },
  pt5: { title: "PT-5 Injector Manifold", unit: "psi", source: "AIN4", kind: "analog", color: "#cbd5e1" },
  pt6: { title: "PT-6 Nitrous Tank", unit: "psi", source: "AIN5", kind: "analog", color: "#f87171" },
  loadCell1: { title: "Load Cell 1", unit: "lbf", source: "AIN7", kind: "analog", color: "#f97316" },
  loadCell2: { title: "Load Cell 2", unit: "lbf", source: "AIN6", kind: "analog", color: "#60a5fa" },
  loadCell2Tare: { title: "Load Cell 2 Tare", unit: "lbf", source: "PLC REG 1", kind: "analog", color: "#93c5fd" },
  tt1: { title: "TT-1", unit: "F", source: "AIN8", kind: "analog", color: "#22c55e" },
  mfv: { title: "Main Fuel Valve", unit: "", source: "DIO0", kind: "digital", color: "#34d399" },
  mov: { title: "Main Oxidizer Valve", unit: "", source: "DIO1", kind: "digital", color: "#34d399" },
  tvv: { title: "Tank Vent Valve", unit: "", source: "DIO2", kind: "digital", color: "#34d399" },
  ofv: { title: "Oxidizer Fill Valve", unit: "", source: "DIO3", kind: "digital", color: "#34d399" }
};

function convertF(valueF) {
  if (typeof valueF !== "number") return null;
  return (valueF - 32) * (5 / 9);
}

function getSignalValue(state, key) {
  const sensors = state?.sensors || {};
  const valves = state?.valves || {};
  const tank = state?.system?.tank || {};

  if (key === "loadCell2Tare") return typeof tank.tareWeightLbf === "number" ? tank.tareWeightLbf : null;
  if (key === "mfv" || key === "mov" || key === "tvv" || key === "ofv") {
    if (valves[key] === "OPEN") return 1;
    if (valves[key] === "CLOSED") return 0;
    return null;
  }
  return typeof sensors[key] === "number" ? sensors[key] : null;
}

function formatSelectedValue(key, value) {
  const meta = SIGNAL_META[key];
  if (!meta) return "--";
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  if (meta.kind === "digital") return value >= 0.5 ? "OPEN" : "CLOSED";
  const decimals = meta.unit === "psi" ? 3 : 2;
  return `${value.toFixed(decimals)}${meta.unit ? ` ${meta.unit}` : ""}`;
}

export default function OverviewPanel({ state, ignitorStatus }) {
  const tt1Value = convertF(state?.sensors?.tt1);
  const sequence = state?.system?.sequence || {};
  const sequenceCode = typeof sequence.code === "number" ? sequence.code : null;
  const sequenceOnline = Boolean(sequence.online);
  const activeIdx = SEQUENCE_STATES.findIndex((s) => s.code === sequenceCode);
  const [selectedSignal, setSelectedSignal] = useState("pt1");
  const [trendSeries, setTrendSeries] = useState(() => {
    const init = {};
    Object.keys(SIGNAL_META).forEach((key) => {
      init[key] = [];
    });
    return init;
  });

  useEffect(() => {
    if (!state?.timestamp) return;
    setTrendSeries((prev) => {
      const next = { ...prev };
      Object.keys(SIGNAL_META).forEach((key) => {
        const value = getSignalValue(state, key);
        if (typeof value !== "number" || Number.isNaN(value)) return;
        next[key] = [...(prev[key] || []), { ts: state.timestamp, value }].slice(-MAX_TREND_POINTS);
      });
      return next;
    });
  }, [state]);

  const selectedMeta = SIGNAL_META[selectedSignal] || SIGNAL_META.pt1;
  const selectedValue = getSignalValue(state, selectedSignal);
  const selectedPoints = trendSeries[selectedSignal] || [];
  const selectedMax = useMemo(() => {
    const values = selectedPoints
      .map((p) => (typeof p?.value === "number" ? p.value : null))
      .filter((v) => typeof v === "number");
    if (!values.length) return null;
    return Math.max(...values);
  }, [selectedPoints]);
  const trendChartData = useMemo(
    () => ({
      labels: selectedPoints.map((point) =>
        point?.ts ? new Date(point.ts).toLocaleTimeString() : "--:--:--"
      ),
      datasets: [
        {
          label: `${selectedMeta.title}${selectedMeta.unit ? ` (${selectedMeta.unit})` : ""}`,
          data: selectedPoints.map((point) => point?.value ?? null),
          borderColor: selectedMeta.color,
          backgroundColor: selectedMeta.color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 12,
          tension: 0.22
        }
      ]
    }),
    [selectedMeta, selectedPoints]
  );
  const trendChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (items) => {
              if (!items.length) return "";
              return `${items[0].label}`;
            },
            label: (ctx) => {
              const y = typeof ctx.parsed.y === "number" ? ctx.parsed.y : null;
              if (y === null) return "--";
              const decimals = selectedMeta.unit === "psi" ? 3 : 2;
              return `${y.toFixed(decimals)}${selectedMeta.unit ? ` ${selectedMeta.unit}` : ""}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            display: false
          },
          grid: {
            color: "rgba(148,163,184,0.10)"
          }
        },
        y: {
          ticks: {
            color: "rgba(226,232,240,0.75)"
          },
          grid: {
            color: "rgba(148,163,184,0.10)"
          }
        }
      }
    }),
    [selectedMeta]
  );

  return (
    <div className="overview-grid">
      <div className="overview-sequence-rail" aria-label="Sequence State">
        <div className="overview-sequence-headline">Sequence State</div>
        <div className={`overview-sequence-online ${sequenceOnline ? "online" : "offline"}`}>
          {sequenceOnline ? "PLC ONLINE" : "PLC OFFLINE"}
        </div>
        {SEQUENCE_STATES.map((s, idx) => {
          const status =
            activeIdx < 0 ? "awaiting" : idx < activeIdx ? "completed" : idx === activeIdx ? "active" : "awaiting";
          const visualStatus = sequenceOnline ? status : "offline";
          const statusLabel =
            visualStatus === "completed" || visualStatus === "active" ? "Applied" : "Awaiting";
          return (
            <div className={`overview-seq-line ${visualStatus}`} key={s.code}>
              <span className="overview-seq-dot" />
              <span className="overview-seq-code">{s.code}</span>
              <span className="overview-seq-name">{s.name}</span>
              <span className="overview-seq-status">{statusLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="section overview-left no-bg">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="kicker" style={{ marginBottom: 10, textAlign: "center" }}>Pressure Transducers</div>
          <div className="overview-pt-stack" style={{ justifyItems: "center", alignItems: "center", justifyContent: "center" }}>
            {PT_CONFIG.map((pt) => (
              <SemiGauge
                key={pt.id}
                label={pt.label}
                value={state?.sensors?.[pt.id]}
                unit={pt.unit}
                min={pt.min}
                max={pt.max}
                color={pt.color}
              />
            ))}
          </div>
          <div className="overview-trend-wrap">
            <div className="overview-trend-shell">
              <div className="overview-trend-head">
                <div>
                  <div className="kicker" style={{ marginBottom: 4, textAlign: "left" }}>Live Trend</div>
                  <div className="overview-trend-title">{selectedMeta.title}</div>
                </div>
                <div className="overview-trend-meta">
                  <div className="overview-trend-meta-row">
                    <div className="overview-trend-source">MAX {formatSelectedValue(selectedSignal, selectedMax)}</div>
                    <div className="overview-trend-source">{selectedMeta.source}</div>
                  </div>
                  <div className="overview-trend-value">{formatSelectedValue(selectedSignal, selectedValue)}</div>
                </div>
              </div>
              <div className="overview-trend-chart">
                <Line data={trendChartData} options={trendChartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section overview-center no-bg">
        <div className="kicker" style={{ marginBottom: 10, textAlign: "left" }}>P&ID Diagram</div>
        <PidDiagram state={state} selectedKey={selectedSignal} onSelect={setSelectedSignal} />
      </div>

      <div className="section overview-right no-bg">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 360 }}>
            <ThermocoupleSelectedPanel tempC={tt1Value} limitC={350} />
          </div>

          <div className="kicker" style={{ marginTop: 18, marginBottom: 12, textAlign: "center" }}>Load Cells</div>
          <div className="sensor-readouts" style={{ width: "100%", maxWidth: 360, display: "grid", gap: 12 }}>
            <SensorReadout title="Load Cell 1 (Thrust)" value={state?.sensors?.loadCell1} unit="lbf" max={2000} variant="thrust" />
            <TankCard
              tankLbf={state?.sensors?.loadCell2}
              fluidWeightLbf={state?.system?.tank?.fluidWeightLbf}
              tareWeightLbf={state?.system?.tank?.tareWeightLbf}
              fluidMaxLbf={state?.system?.tank?.fluidMaxLbf}
              maxTankLbf={220.46}
              gaugeMinLbf={TANK_GAUGE_MIN_LBF}
              gaugeMaxLbf={TANK_GAUGE_MAX_LBF}
              fluidLabel="N2O"
            />
            <div className="continuity-box continuity-box-compact continuity-under-tank">
              <div className="continuity-head">
                <span className="continuity-title">Ignitors</span>
                <span className={`continuity-pill ${ignitorStatus?.continuityClass || "unknown"}`}>
                  {ignitorStatus?.continuityLabel || "UNKNOWN"}
                </span>
              </div>
              <div className="continuity-grid">
                <div className="continuity-chip">
                  <span className="cut-label">IGN-1</span>
                  <span className={`continuity-pill ${ignitorStatus?.ignitor1Class || "unknown"}`}>
                    {ignitorStatus?.ignitor1Label || "UNKNOWN"}
                  </span>
                </div>
                <div className="continuity-chip">
                  <span className="cut-label">IGN-2</span>
                  <span className={`continuity-pill ${ignitorStatus?.ignitor2Class || "unknown"}`}>
                    {ignitorStatus?.ignitor2Label || "UNKNOWN"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
