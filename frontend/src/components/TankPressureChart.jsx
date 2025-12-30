// frontend/src/components/TankPressureChart.jsx

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

export default function TankPressureChart() {
  const [series, setSeries] = useState({});
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    connectEngineSocket();

    const unsubscribe = subscribeEngineState((state) => {
      const pressures = state?.sensors?.pressure;
      if (!pressures) return;

      setSeries((prev) => {
        const next = { ...prev };

        Object.entries(pressures).forEach(([name, value]) => {
          if (typeof value !== "number") return;

          if (!next[name]) {
            next[name] = [];
          }

          next[name] = [
            ...next[name],
            { x: state.timestamp, y: value },
          ].slice(-MAX_POINTS);
        });

        return next;
      });
    });

    return unsubscribe;
  }, []);

  const chartData = {
    datasets: Object.entries(series).map(([name, data], idx) => ({
      label: `${name} (psi)`,
      data,
      borderWidth: 2,
      pointRadius: 0,
    })),
  };

  const options = {
    animation: false,
    responsive: true,
    scales: {
      x: { type: "time", time: { unit: "second" } },
      y: {
        title: { display: true, text: "psi" },
      },
    },
  };

  const chart = <Line data={chartData} options={options} />;

  return (
    <>
      <div onClick={() => setZoomed(true)}>
        {chart}
      </div>

      {zoomed && (
        <LiveChartModal
          title="Tank Pressure vs Time"
          onClose={() => setZoomed(false)}
        >
          {chart}
        </LiveChartModal>
      )}
    </>
  );
}
