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
  Legend,
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
  return pickFirstNumber(raw);
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
        outline: "none",
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
  });

  const [modalKey, setModalKey] = useState(null);

  useEffect(() => {
    connectEngineSocket();

    const unsub = subscribeEngineState((state) => {
      const ts = state?.timestamp ? new Date(state.timestamp) : new Date();

      const thrust = getSensor(state, "thrust");
      const tankP = getSensor(state, "tankPressure") ?? getSensor(state, "tank_pressure");
      const chamberP = getSensor(state, "chamberPressure") ?? getSensor(state, "chamber_pressure");
      const temp = getSensor(state, "temperature") ?? getSensor(state, "temp");

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
        y: { beginAtZero: false },
      },
    };
  }, []);

  function makeData(label, points) {
    return {
      datasets: [
        {
          label,
          data: points,
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    };
  }

  const tiles = [
    { key: "thrust", title: "Thrust vs Time", unit: "lbf", label: "Thrust (lbf)", points: series.thrust },
    { key: "tankPressure", title: "Tank Pressure vs Time", unit: "psi", label: "Tank Pressure (psi)", points: series.tankPressure },
    { key: "chamberPressure", title: "Chamber Pressure vs Time", unit: "psi", label: "Chamber Pressure (psi)", points: series.chamberPressure },
    { key: "temperature", title: "Temp vs Time", unit: "°C", label: "Temperature (°C)", points: series.temperature },
  ];

  const modalTile = tiles.find((t) => t.key === modalKey) || null;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
          width: "100%",
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
              <Line data={makeData(t.label, t.points)} options={baseOptions} />
            </Tile>
          );
        })}
      </div>

      {modalTile && (
        <LiveChartModal title={modalTile.title} onClose={() => setModalKey(null)}>
          <div style={{ height: "100%", width: "100%" }}>
            <Line data={makeData(modalTile.label, modalTile.points)} options={baseOptions} />
          </div>
        </LiveChartModal>
      )}
    </div>
  );
}
