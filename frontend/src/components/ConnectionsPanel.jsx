import React, { useEffect, useMemo, useState } from "react";

const MAX_HEARTBEAT_POINTS = 28;
const MAX_BATTERY_POINTS = 36;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function classifyBattery(value, nominal = 12) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { label: "UNKNOWN", className: "unknown", percent: 0 };
  }

  const percent = clamp((value / nominal) * 100, 0, 100);
  if (value >= nominal * 0.96) return { label: "STRONG", className: "good", percent };
  if (value >= nominal * 0.9) return { label: "OK", className: "warn", percent };
  return { label: "LOW", className: "bad", percent };
}

function heartbeatPath(ok, count = MAX_HEARTBEAT_POINTS) {
  if (!ok) {
    return Array.from({ length: count }, (_, i) => `${i * 4},20`).join(" ");
  }

  const pattern = [20, 20, 19, 17, 10, 24, 8, 20, 20, 19, 18, 20];
  return Array.from({ length: count }, (_, i) => `${i * 4},${pattern[i % pattern.length]}`).join(" ");
}

function formatAge(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms) || ms < 0) return "--";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function Heartbeat({ ok }) {
  return (
    <div className={`conn-heartbeat ${ok ? "online" : "offline"}`} aria-hidden>
      <svg viewBox="0 0 108 28" preserveAspectRatio="none">
        <polyline points={heartbeatPath(ok)} />
      </svg>
    </div>
  );
}

function StatusRow({ label, ok, detail, meta }) {
  return (
    <div className={`conn-row ${ok ? "ok" : "bad"}`}>
      <div className="conn-row-main">
        <span className={`conn-dot ${ok ? "ok" : "bad"}`} aria-hidden />
        <div>
          <div className="conn-label">{label}</div>
          {detail ? <div className="conn-detail">{detail}</div> : null}
        </div>
      </div>

      <div className="conn-row-status">
        {meta ? <div className="conn-row-meta">{meta}</div> : null}
        <Heartbeat ok={ok} />
        <span className={`tag ${ok ? "ok" : "bad"}`}>{ok ? "ONLINE" : "OFFLINE"}</span>
      </div>
    </div>
  );
}

function BatterySparkline({ values = [], statusClass = "unknown" }) {
  const filtered = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  const points = filtered.slice(-MAX_BATTERY_POINTS);
  if (!points.length) {
    return (
      <div className={`battery-spark ${statusClass}`}>
        <svg viewBox="0 0 120 32" preserveAspectRatio="none">
          <polyline points="0,22 120,22" />
        </svg>
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 0.02);
  const polyline = points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 120;
      const y = 26 - ((value - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`battery-spark ${statusClass}`}>
      <svg viewBox="0 0 120 32" preserveAspectRatio="none">
        <polyline points={polyline} />
      </svg>
    </div>
  );
}

function BatteryRow({ label, value, history, nominal = 12 }) {
  const health = classifyBattery(value, nominal);
  const display = typeof value === "number" ? `${value.toFixed(2)} V` : "--";

  return (
    <div className="battery-row enhanced">
      <div className="battery-meta">
        <div className="battery-label">{label}</div>
        <div className="battery-submeta">
          <span className="battery-val">{display}</span>
          <span className={`battery-health ${health.className}`}>{health.label}</span>
        </div>
      </div>

      <div className="battery-visuals">
        <BatterySparkline values={history} statusClass={health.className} />
        <div className="battery-bar" aria-hidden>
          <span style={{ width: `${health.percent}%` }} className={`battery-fill ${health.className}`} />
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsPanel({ system = {}, socket = {}, connections = {} }) {
  const [batteryHistory, setBatteryHistory] = useState({
    teensy: [],
    ljt7: [],
    p_bus: [],
    tc_amp: [],
    aux: []
  });

  useEffect(() => {
    setBatteryHistory((prev) => {
      const nextSamples = {
        teensy: system?.batteries?.teensy,
        ljt7: system?.batteries?.ljt7,
        p_bus: system?.batteries?.sensors?.p_bus,
        tc_amp: system?.batteries?.sensors?.tc_amp,
        aux: system?.batteries?.sensors?.aux
      };

      const next = { ...prev };
      let changed = false;

      Object.entries(nextSamples).forEach(([key, value]) => {
        if (typeof value !== "number" || Number.isNaN(value)) return;
        const prevSeries = prev[key] || [];
        if (prevSeries[prevSeries.length - 1] === value) return;
        next[key] = [...prevSeries, value].slice(-MAX_BATTERY_POINTS);
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [
    system?.batteries?.teensy,
    system?.batteries?.ljt7,
    system?.batteries?.sensors?.p_bus,
    system?.batteries?.sensors?.tc_amp,
    system?.batteries?.sensors?.aux
  ]);

  const logging = system.logging || {};
  const csvLogging = logging.csv || {};
  const videoLogging = logging.video || {};
  const sequence = system.sequence || {};
  const now = Date.now();
  const lastUpdateAgeMs = system.lastUpdate ? now - system.lastUpdate : null;
  const batteryValues = [
    system?.batteries?.teensy,
    system?.batteries?.ljt7,
    system?.batteries?.sensors?.p_bus,
    system?.batteries?.sensors?.tc_amp,
    system?.batteries?.sensors?.aux
  ].filter((value) => typeof value === "number" && !Number.isNaN(value));
  const batteryAverage =
    batteryValues.length > 0
      ? batteryValues.reduce((sum, value) => sum + value, 0) / batteryValues.length
      : null;
  const batteryFleet = classifyBattery(batteryAverage, 12);

  const connectionCards = useMemo(
    () => [
      {
        label: "GUI WebSocket",
        ok: Boolean(socket.connected),
        detail: "Frontend telemetry socket",
        meta: "PORT 8080"
      },
      {
        label: "DAQ TCP",
        ok: Boolean(connections.labjack),
        detail: system.lastUpdate ? `Last packet ${formatAge(lastUpdateAgeMs)} ago` : "Awaiting DAQ packets",
        meta: "PORT 9000"
      },
      {
        label: "Sensors Bus",
        ok: Boolean(connections.sensors),
        detail: "LabJack T7 Ethernet link",
        meta: sequence.online ? "PLC ONLINE" : "PLC OFFLINE"
      },
      {
        label: "Camera A",
        ok: Boolean(connections.camera1),
        detail: videoLogging.ok ? "Recorder path healthy" : "Recorder not healthy",
        meta: "TEST STAND"
      },
      {
        label: "Camera B",
        ok: Boolean(connections.camera2),
        detail: videoLogging.latestWrite ? `Last video write ${new Date(videoLogging.latestWrite).toLocaleTimeString()}` : "No recent video write",
        meta: "ENGINE CHAMBER"
      },
      {
        label: "CSV Logger",
        ok: Boolean(csvLogging.ok || logging.active),
        detail: csvLogging.lastWrite ? `Last CSV write ${new Date(csvLogging.lastWrite).toLocaleTimeString()}` : "No CSV writes yet",
        meta: logging.active ? "ACTIVE" : "INACTIVE"
      }
    ],
    [
      socket.connected,
      connections.labjack,
      connections.sensors,
      connections.camera1,
      connections.camera2,
      system.lastUpdate,
      lastUpdateAgeMs,
      sequence.online,
      videoLogging.ok,
      videoLogging.latestWrite,
      csvLogging.ok,
      csvLogging.lastWrite,
      logging.active
    ]
  );

  return (
    <div className="conn-grid enhanced">
      <div className="section no-bg">
        <div className="kicker conn-panel-title">Connections</div>

        <div className="conn-overview-strip">
          <div className="conn-summary-tile">
            <div className="conn-summary-label">DAQ Freshness</div>
            <div className="conn-summary-value">{formatAge(lastUpdateAgeMs)}</div>
          </div>
          <div className="conn-summary-tile">
            <div className="conn-summary-label">Sequence</div>
            <div className="conn-summary-value">{sequence.online ? sequence.name || "ONLINE" : "OFFLINE"}</div>
          </div>
          <div className="conn-summary-tile">
            <div className="conn-summary-label">WS Clients</div>
            <div className="conn-summary-value">{system.wsClients ?? 0}</div>
          </div>
        </div>

        <div className="conn-stack enhanced">
          {connectionCards.map((item) => (
            <StatusRow
              key={item.label}
              label={item.label}
              ok={item.ok}
              detail={item.detail}
              meta={item.meta}
            />
          ))}
        </div>
      </div>

      <div className="section no-bg">
        <div className="kicker conn-panel-title">Battery Health</div>

        <div className="battery-summary-tile">
          <div>
            <div className="battery-summary-label">Fleet Voltage</div>
            <div className="battery-summary-value">
              {typeof batteryAverage === "number" ? `${batteryAverage.toFixed(2)} V` : "--"}
            </div>
          </div>
          <div className={`battery-health ${batteryFleet.className}`}>{batteryFleet.label}</div>
        </div>

        <div className="batt-panel enhanced">
          <BatteryRow
            label="Controller (Teensy)"
            value={system?.batteries?.teensy}
            history={batteryHistory.teensy}
          />
          <BatteryRow
            label="DAQ (LabJack T7)"
            value={system?.batteries?.ljt7}
            history={batteryHistory.ljt7}
          />
          <BatteryRow
            label="Sensor Bus"
            value={system?.batteries?.sensors?.p_bus}
            history={batteryHistory.p_bus}
          />
          <BatteryRow
            label="TC Amplifier"
            value={system?.batteries?.sensors?.tc_amp}
            history={batteryHistory.tc_amp}
          />
          <BatteryRow
            label="Aux Rail"
            value={system?.batteries?.sensors?.aux}
            history={batteryHistory.aux}
          />
        </div>
      </div>
    </div>
  );
}
