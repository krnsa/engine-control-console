// frontend/src/components/GraphsPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend
} from "chart.js";
import "chartjs-adapter-date-fns";

import LiveChartModal from "./LiveChartModal";
import { connectEngineSocket, subscribeEngineState } from "../engineSocket";

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

const MAX_POINTS = 600;

function pickFirstNumber(x) {
  if (typeof x === "number") {
    return x;
  }
  if (x && typeof x === "object") {
    for (const v of Object.values(x)) {
      if (typeof v === "number") {
        return v;
      }
    }
  }
  return null;
}

function getSensor(state, key) {
  // supports state.sensors[key] being number OR object with units, etc.
  const raw = state?.sensors?.[key];
  const picked = pickFirstNumber(raw);
  if (typeof picked === "number") return picked;
  return null;
}

function Tile({ title, valueText, unitText, children, onOpen }) {
  return (
    <div
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(22, 26, 33, 0.55)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        padding: 14,
        cursor: "pointer",
        height: 280,
        display: "flex",
        flexDirection: "column",
        outline: "none"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          <div style={{ fontWeight: 700, opacity: 0.85 }}>{valueText}</div>
          <div style={{ opacity: 0.65, fontSize: 12 }}>{unitText}</div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

export default function GraphsPanel() {
  const [series, setSeries] = useState({
    thrust: [],
    tankPressure: [],
    chamberPressure: [],
    temperature: [],
    pt1: [],
    pt2: [],
    pt3: [],
    pt4: [],
    pt5: [],
    pt6: []
  });

  const [modalKey, setModalKey] = useState(null);
  const [showPtGraphs, setShowPtGraphs] = useState(false);

  useEffect(() => {
    connectEngineSocket();

    const unsub = subscribeEngineState((state) => {
      const ts = state?.timestamp ? new Date(state.timestamp) : new Date();

      const thrust = getSensor(state, "loadCell1") ?? state?.thrust?.loadCell1;
      const tankP =
        getSensor(state, "pt1") ??
        state?.pressures?.pt1;
      const chamberP =
        getSensor(state, "pt6") ??
        state?.pressures?.pt6;
      const temp =
        getSensor(state, "tt1") ??
        state?.temperature?.tt1;
      const pt1 = getSensor(state, "pt1") ?? state?.pressures?.pt1;
      const pt2 = getSensor(state, "pt2") ?? state?.pressures?.pt2;
      const pt3 = getSensor(state, "pt3") ?? state?.pressures?.pt3;
      const pt4 = getSensor(state, "pt4") ?? state?.pressures?.pt4;
      const pt5 = getSensor(state, "pt5") ?? state?.pressures?.pt5;
      const pt6 = getSensor(state, "pt6") ?? state?.pressures?.pt6;

      setSeries((prev) => {
        const next = { ...prev };

        if (typeof thrust === "number") {
          next.thrust = [...prev.thrust, { x: ts, y: thrust }].slice(-MAX_POINTS);
        }
        if (typeof tankP === "number") {
          next.tankPressure = [...prev.tankPressure, { x: ts, y: tankP }].slice(-MAX_POINTS);
        }
        if (typeof chamberP === "number") {
          next.chamberPressure = [...prev.chamberPressure, { x: ts, y: chamberP }].slice(-MAX_POINTS);
        }
        if (typeof temp === "number") {
          next.temperature = [...prev.temperature, { x: ts, y: temp }].slice(-MAX_POINTS);
        }
        if (typeof pt1 === "number") {
          next.pt1 = keepFirstPoint(prev.pt1, { x: ts, y: pt1 });
        }
        if (typeof pt2 === "number") {
          next.pt2 = keepFirstPoint(prev.pt2, { x: ts, y: pt2 });
        }
        if (typeof pt3 === "number") {
          next.pt3 = keepFirstPoint(prev.pt3, { x: ts, y: pt3 });
        }
        if (typeof pt4 === "number") {
          next.pt4 = keepFirstPoint(prev.pt4, { x: ts, y: pt4 });
        }
        if (typeof pt5 === "number") {
          next.pt5 = keepFirstPoint(prev.pt5, { x: ts, y: pt5 });
        }
        if (typeof pt6 === "number") {
          next.pt6 = keepFirstPoint(prev.pt6, { x: ts, y: pt6 });
        }

        return next;
      });
    });

    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, []);

  const baseOptions = useMemo(() => {
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { type: "time", time: { unit: "second" } },
        y: { beginAtZero: false }
      }
    };
  }, []);

  function keepFirstPoint(points, nextPoint) {
    const updated = [...points, nextPoint];
    if (updated.length <= MAX_POINTS) return updated;
    return [updated[0], ...updated.slice(-(MAX_POINTS - 1))];
  }

  function getMaxWithPadding(points, padding = 100) {
    if (!points.length) return 2000;                  // max padding is now the max recorded on the pts 
    let max = points[0].y;
    for (let i = 1; i < points.length; i += 1) {     // y - axis scaling should work now 
      if (points[i].y > max) max = points[i].y;
    }
    return Math.max(0, max + padding);
  }

  function makePtOptions(points) { // so this should auto-scale y-axis - unless test with the data points
    return {                       // and go back to v4 for the testing end of the project
      ...baseOptions,
      scales: {                    // scaling should be working respectively 
        ...baseOptions.scales,
        y: { beginAtZero: true, min: 0, max: getMaxWithPadding(points) }
      }
    };
  }

  function makeData(label, points, color) {
    return {
      datasets: [
        {
          label,
          data: points,
          borderWidth: 2,
          pointRadius: 0,
          borderColor: color,
          backgroundColor: color
        }
      ]
    };
  }

  const tiles = [
    { key: "thrust", title: "Thrust vs Time", unit: "lbf", label: "Thrust (lbf)", points: series.thrust, color: "#ef4444" },
    { key: "tankPressure", title: "Tank Pressure vs Time", unit: "psi", label: "Tank Pressure (psi)", points: series.tankPressure, color: "#0ea5e9" },
    { key: "chamberPressure", title: "Chamber Pressure vs Time", unit: "psi", label: "Chamber Pressure (psi)", points: series.chamberPressure, color: "#f97316" },
    { key: "temperature", title: "Temp vs Time", unit: "F", label: "Temperature (F)", points: series.temperature, color: "#22c55e" }
  ];

  const ptTiles = [
    { key: "pt1", title: "PT-1 Ox Feed vs Time", unit: "psi", label: "PT-1 Ox Feed (psi)", points: series.pt1, color: "#38bdf8" },
    { key: "pt2", title: "PT-2 IPA Tank vs Time", unit: "psi", label: "PT-2 IPA Tank (psi)", points: series.pt2, color: "#fb923c" },
    { key: "pt3", title: "PT-3 Ox Feed vs Time", unit: "psi", label: "PT-3 Ox Feed (psi)", points: series.pt3, color: "#4ade80" },
    { key: "pt4", title: "PT-4 Regen Inlet vs Time", unit: "psi", label: "PT-4 Regen Inlet (psi)", points: series.pt4, color: "#facc15" },
    { key: "pt5", title: "PT-5 Injector Manifold vs Time", unit: "psi", label: "PT-5 Injector Manifold (psi)", points: series.pt5, color: "#a3a3a3" },
    { key: "pt6", title: "PT-6 Nitrous Tank vs Time", unit: "psi", label: "PT-6 Nitrous Tank (psi)", points: series.pt6, color: "#f87171" }
  ];
  const modalTile = [...tiles, ...ptTiles].find((t) => t.key === modalKey) || null;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn" onClick={() => setShowPtGraphs((prev) => !prev)}>
          {showPtGraphs ? "Hide PT Graphs" : "PT Graphs"}
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
          width: "100%"
        }}
      >
        {tiles.map((t) => {
          const last = t.points.length ? t.points[t.points.length - 1].y : 0;
          const valueText = Number.isFinite(last) ? last.toFixed(1) : "0.0";

          return (
            <Tile
              key={t.key}
              title={t.title}
              valueText={valueText}
              unitText={t.unit}
              onOpen={() => setModalKey(t.key)}
            >
              <Line data={makeData(t.label, t.points, t.color)} options={baseOptions} />
            </Tile>
          );
        })}
      </div>

      {showPtGraphs && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
            width: "100%",
            marginTop: 16
          }}
        >
          {ptTiles.map((t) => {
            const last = t.points.length ? t.points[t.points.length - 1].y : 0;
            const valueText = Number.isFinite(last) ? last.toFixed(1) : "0.0";

            return (
              <Tile
                key={t.key}
                title={t.title}
                valueText={valueText}
                unitText={t.unit}
                onOpen={() => setModalKey(t.key)}
              >
                <Line data={makeData(t.label, t.points, t.color)} options={makePtOptions(t.points)} />
              </Tile>
            );
          })}
        </div>
      )}

      {modalTile && (
        <LiveChartModal title={modalTile.title} onClose={() => setModalKey(null)}>
          <div style={{ height: "100%", width: "100%" }}>
            <Line
              data={makeData(modalTile.label, modalTile.points, modalTile.color)}
              options={modalTile.key.startsWith("pt") ? makePtOptions(modalTile.points) : baseOptions}
            />
          </div>
        </LiveChartModal>
      )}
    </div>
  );
}
