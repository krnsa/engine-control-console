// frontend/src/components/ThrustChart.jsx

import React, { useEffect, useState } from "react";
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

import { connectEngineSocket, subscribeEngineState } from "../engineSocket";
import LiveChartModal from "./LiveChartModal";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend
);

const MAX_POINTS = 1000;
const CHART_HEIGHT = 260; // 🔒 FIXED HEIGHT (CRITICAL)

export default function ThrustChart() {
  const [dataPoints, setDataPoints] = useState([]);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    connectEngineSocket();

    const unsubscribe = subscribeEngineState((state) => {
      const thrust = state?.sensors?.thrust;
      if (!thrust) return;

      const value = Object.values(thrust)[0];
      if (typeof value !== "number") return;

      setDataPoints((prev) =>
        [...prev, { x: state.timestamp, y: value }].slice(-MAX_POINTS)
      );
    });

    return unsubscribe;
  }, []);

  const chartData = {
    datasets: [
      {
        label: "Thrust (lbf)",
        data: dataPoints,
        borderColor: "#4db6ff",
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: { unit: "second" },
      },
      y: {
        title: { display: true, text: "lbf" },
      },
    },
  };

  return (
    <>
      {/* CLICKABLE GRAPH CONTAINER */}
      <div
        onClick={() => setZoomed(true)}
        style={{
          position: "relative",
          height: CHART_HEIGHT,
          cursor: "pointer",
        }}
      >
        {/* Chart (disable pointer capture) */}
        <div style={{ pointerEvents: "none", height: "100%" }}>
          <Line data={chartData} options={options} />
        </div>
      </div>

      {zoomed && (
        <LiveChartModal
          title="Thrust vs Time"
          onClose={() => setZoomed(false)}
        >
          <div style={{ height: "100%" }}>
            <Line data={chartData} options={options} />
          </div>
        </LiveChartModal>
      )}
    </>
  );
}
