import React from "react";

function StatusRow({ label, ok, detail }) {
  return (
    <div className="conn-row">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className={`conn-dot ${ok ? "ok" : "bad"}`} aria-hidden />
        <div>
          <div className="conn-label">{label}</div>
          {detail ? <div className="conn-detail">{detail}</div> : null}
        </div>
      </div>

      <span className={`tag ${ok ? "ok" : "bad"}`}>{ok ? "ONLINE" : "OFFLINE"}</span>
    </div>
  );
}

export default function ConnectionsPanel({ system = {}, socket = {}, connections = {} }) {
  const lastUpdate = system.lastUpdate ? `${((Date.now() - system.lastUpdate) / 1000).toFixed(2)} s` : "--";
  const logging = system.logging || {};

  return (
    <div className="conn-grid">
      <div className="section no-bg">
        <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Core Links</div>

        <div className="conn-stack" style={{ marginBottom: 8 }}>
          <StatusRow label="GUI WebSocket" ok={socket.connected} detail="Port 8080" />
          <StatusRow label="DAQ TCP" ok={connections.labjack} detail="Port 9000" />
          <StatusRow label="Sensors Bus" ok={connections.sensors} detail="LabJack T7" />
        </div>

        <div style={{ marginTop: 6, marginBottom: 8 }}>
          <div className="sub-kicker">Cameras</div>
          <div className="conn-stack" style={{ marginTop: 8 }}>
          <StatusRow label="Camera A" ok={connections.camera1} detail="Live feed" />
          <StatusRow label="Camera B" ok={connections.camera2} detail="Live feed" />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div className="sub-kicker">System Health</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="conn-label">Last Update Age</span>
                <span>{lastUpdate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="conn-label">WS Clients</span>
                <span>{system.wsClients ?? 0}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="conn-label">Logging</span>
                <span className={`tag ${logging.active ? "ok" : "bad"}`}>{logging.active ? "ACTIVE" : "INACTIVE"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section no-bg">
        <div className="kicker" style={{ marginBottom: 10, textAlign: "left" }}>Battery Levels</div>
        <div className="batt-panel">
          {/* BatteriesPanel is also available as a separate component, but render a compact graph here */}
          <div className="batt-rows">
            {/* Controller */}
            <div className="battery-row">
              <div className="battery-meta">
                <div className="battery-label">Controller (Teensy)</div>
                <div className="battery-val">{system?.batteries?.teensy ? `${system.batteries.teensy.toFixed(2)} V` : `-`}</div>
              </div>
              <div className="battery-bar" aria-hidden>
                <span style={{ width: system?.batteries?.teensy ? `${Math.min(100, (system.batteries.teensy/12)*100)}%` : `0%` }} />
              </div>
            </div>

            <div className="battery-row">
              <div className="battery-meta">
                <div className="battery-label">DAQ (LabJack T7)</div>
                <div className="battery-val">{system?.batteries?.ljt7 ? `${system.batteries.ljt7.toFixed(2)} V` : `-`}</div>
              </div>
              <div className="battery-bar" aria-hidden>
                <span style={{ width: system?.batteries?.ljt7 ? `${Math.min(100, (system.batteries.ljt7/12)*100)}%` : `0%` }} />
              </div>
            </div>

            <div className="battery-row">
              <div className="battery-meta">
                <div className="battery-label">Sensor Bus</div>
                <div className="battery-val">{system?.batteries?.sensors?.p_bus ? `${system.batteries.sensors.p_bus.toFixed(2)} V` : `-`}</div>
              </div>
              <div className="battery-bar" aria-hidden>
                <span style={{ width: system?.batteries?.sensors?.p_bus ? `${Math.min(100, (system.batteries.sensors.p_bus/12)*100)}%` : `0%` }} />
              </div>
            </div>

            <div className="battery-row">
              <div className="battery-meta">
                <div className="battery-label">TC Amplifier</div>
                <div className="battery-val">{system?.batteries?.sensors?.tc_amp ? `${system.batteries.sensors.tc_amp.toFixed(2)} V` : `-`}</div>
              </div>
              <div className="battery-bar" aria-hidden>
                <span style={{ width: system?.batteries?.sensors?.tc_amp ? `${Math.min(100, (system.batteries.sensors.tc_amp/12)*100)}%` : `0%` }} />
              </div>
            </div>

            <div className="battery-row">
              <div className="battery-meta">
                <div className="battery-label">Aux Rail</div>
                <div className="battery-val mono">{system?.batteries?.sensors?.aux ? `${system.batteries.sensors.aux.toFixed(2)} V` : `-`}</div>
              </div>
              <div className="battery-bar" aria-hidden>
                <span style={{ width: system?.batteries?.sensors?.aux ? `${Math.min(100, (system.batteries.sensors.aux/12)*100)}%` : `0%` }} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
