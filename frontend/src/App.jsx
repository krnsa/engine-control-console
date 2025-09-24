import React, { useEffect, useMemo, useState } from "react";
import NavBar from "./components/NavBar.jsx";
import ConnectionsPanel from "./components/ConnectionsPanel.jsx";
import StatusPanel from "./components/StatusPanel.jsx";
import BatteriesPanel from "./components/BatteriesPanel.jsx";
import ValvesStatusPanel from "./components/ValvesStatusPanel.jsx";
import TelemetryTiles from "./components/TelemetryTiles.jsx";
import TelemetryInfo from "./components/TelemetryInfo.jsx";
import CameraPanel from "./components/CameraPanel.jsx";
import LiveChartModal from "./components/LiveChartModal.jsx";

import PermissivesMatrix from "./components/PermissivesMatrix.jsx";
import RedlinesMonitor from "./components/RedlinesMonitor.jsx";
import InterlocksState from "./components/InterlocksState.jsx";
import ValveMap from "./components/ValveMap.jsx";
import PressurizationStatus from "./components/PressurizationStatus.jsx";
import PropInventory from "./components/PropInventory.jsx";
import PadEnvironment from "./components/PadEnvironment.jsx";
import ExclusionEStop from "./components/ExclusionEStop.jsx";
import RunTimeline from "./components/RunTimeline.jsx";
import ChecklistCard from "./components/ChecklistCard.jsx";
import ProcedureSnippets from "./components/ProcedureSnippets.jsx";
import CameraHealth from "./components/CameraHealth.jsx";
import VisualAnomalyHints from "./components/VisualAnomalyHints.jsx";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Area, ReferenceLine
} from "recharts";

/** ---- Base state ---- */
const initial = {
  connected: false,
  connections: {
    controller: false, sensors: false, labjack: false, network: true,
    camera1: false, camera2: false, camera3: false,
  },
  batteries: { teensy: 12.1, ljt7: 12.0, sensors: { p_bus: 3.8, tc_amp: 3.7, aux: 3.9 } },
  valves: [false, false, false, false],
  pressures: [180, 175, 0, 0, 0, 0],
  tc: 22.0,
  thrust: 0,
  nitrousFill: 0.35,
  env: { temp: 21.2, wind: 4.2, humidity: 58, pressure: 1008, crosswind_ok: true },
  press: { he_bottle: 2100, regulator: 250, target: 250, est_sec: 90 },
  inventory: { n2o_pct: 35, fuel_pct: 62, n2o_rate: 0.6, fuel_rate: 0.2, eta_min: 8 },
  cams: { a: { fps: 29, drop: 0.3, temp: 44, last: "00:12" },
          b: { fps: 30, drop: 0.0, temp: 42, last: "00:08" },
          c: { fps: 28, drop: 0.6, temp: 46, last: "00:25" } },
};
const WS_URL = "ws://127.0.0.1:8000/ws/telemetry";

/** Rolling stats helper */
function rollingVariance(values) {
  if (!values || values.length < 2) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const v = values.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / (n - 1);
  return v;
}
function healthColorForVariance(sensorKey, variance) {
  if (sensorKey.startsWith("p")) { if (variance > 25) return "red"; if (variance > 9) return "yellow"; return "green"; }
  if (sensorKey === "tc")       { if (variance > 4)  return "red"; if (variance > 1.5) return "yellow"; return "green"; }
  if (sensorKey === "nitrous")  { if (variance > 9)  return "red"; if (variance > 3)   return "yellow"; return "green"; }
  return "green";
}

export default function App() {
  const [s, setS] = useState(initial);

  // Series buffers
  const [thrustSeries, setThrustSeries] = useState([]);
  const [sensorSeries, setSensorSeries] = useState({
    tc: [], p0: [], p1: [], p2: [], p3: [], p4: [], p5: [], nitrous: [],
  });

  // UI state
  const [activeTab, setActiveTab] = useState("overview"); // overview/telemetry/cameras/checklist/logs/settings
  const [modal, setModal] = useState(null);
  const [armed, setArmed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState("IDLE"); // IDLE→FILL→CHILL→IGNITE→ABORT
  const [timeline, setTimeline] = useState([
    { key: "cooldown", label: "Start COOL-DOWN", done: false },
    { key: "press", label: "Start PRESS", done: false },
    { key: "arm", label: "Arm", done: false },
    { key: "ignite", label: "Ignite", done: false },
  ]);

  // ---- WebSocket hookup (falls back to simulator) ----
  useEffect(() => {
    let ws; let sim;

    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () =>
        setS((d) => ({
          ...d,
          connected: true,
          connections: { ...d.connections, controller: true, labjack: true, sensors: true, camera1: true, camera2: true, camera3: true },
        }));

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        setS((d) => ({ ...d, ...msg }));
        const now = Date.now();
        setThrustSeries((arr) => [...arr.slice(-600), { t: now, y: msg.thrust ?? 0 }]);
        updateSensorSeries(now, msg);
      };

      ws.onclose = () =>
        setS((d) => ({ ...d, connected: false, connections: { ...d.connections, controller: false } }));
    } catch {
      // SIM
      let thrust = 0, dir = +1, nit = s.nitrousFill;
      sim = setInterval(() => {
        const rand = () => Math.random() - 0.5;
        const pressures = s.pressures.map((p, i) => Math.max(0, p + rand() * (2 + i * 0.4)));
        thrust += dir * (Math.random() * 30);
        if (thrust > 760) dir = -1;
        if (thrust < 0) dir = +1;
        const tc = s.tc + rand() * 0.25;
        nit = Math.max(0, Math.min(1, nit + rand() * 0.004));
        const msg = {
          pressures, tc, thrust: Math.max(0, thrust), nitrousFill: nit,
          connections: { ...s.connections, controller: true, sensors: true, labjack: true, camera1: true, camera2: true, camera3: true }
        };
        setS((d) => ({ ...d, ...msg }));
        const now = Date.now();
        setThrustSeries((arr) => [...arr.slice(-600), { t: now, y: msg.thrust }]);
        updateSensorSeries(now, msg);
      }, 300);
    }

    function updateSensorSeries(now, msg) {
      setSensorSeries((series) => ({
        tc: [...series.tc.slice(-240), { t: now, y: msg.tc ?? s.tc }],
        p0: [...series.p0.slice(-240), { t: now, y: msg.pressures?.[0] ?? s.pressures[0] }],
        p1: [...series.p1.slice(-240), { t: now, y: msg.pressures?.[1] ?? s.pressures[1] }],
        p2: [...series.p2.slice(-240), { t: now, y: msg.pressures?.[2] ?? s.pressures[2] }],
        p3: [...series.p3.slice(-240), { t: now, y: msg.pressures?.[3] ?? s.pressures[3] }],
        p4: [...series.p4.slice(-240), { t: now, y: msg.pressures?.[4] ?? s.pressures[4] }],
        p5: [...series.p5.slice(-240), { t: now, y: msg.pressures?.[5] ?? s.pressures[5] }],
        nitrous: [...series.nitrous.slice(-240), { t: now, y: (msg.nitrousFill ?? s.nitrousFill) * 100 }],
      }));
    }

    return () => { if (ws) ws.close?.(); if (sim) clearInterval(sim); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTileGraph = (key, title) => setModal({ key, title });
  const closeModal = () => setModal(null);
  const ventNitrous = () => { setS(d => ({ ...d, nitrousFill: Math.max(0, d.nitrousFill - 0.15) })); alert("VENT command sent"); };

  // Global status (for the inline HUD summary)
  const camerasLive = !!s.connections.camera1 && !!s.connections.camera2 && !!s.connections.camera3;
  const pressureNominal = Math.max(...(s.pressures ?? [0])) < 900;
  const globalDotClass = armed && pressureNominal && camerasLive ? "ok" : recording ? "warn" : "bad";

  // Sensor health (Telemetry tab)
  const healthWindow = 120;
  const winVals = (arr) => (arr ?? []).slice(-healthWindow).map(p => Number(p.y ?? 0));
  const health = useMemo(() => {
    const h = {}; const keys = ["p0","p1","p2","p3","p4","p5","tc","nitrous"];
    keys.forEach(k => { const v = rollingVariance(winVals(sensorSeries[k])); const c = healthColorForVariance(k, v); h[k] = { var:v, color:c }; });
    return h;
  }, [sensorSeries]);
  const HealthBadge = ({ label, stat }) => {
    const tag = stat?.color === "red" ? "bad" : stat?.color === "yellow" ? "warn" : "ok";
    const text = stat?.color === "red" ? "Unstable" : stat?.color === "yellow" ? "Noisy" : "Healthy";
    return <span className={`tag ${tag}`} title={`Var: ${stat?.var?.toFixed(2)}`}>{label}: {text}</span>;
  };

  // Thrust chart view + rolling avg
  const thrustView = thrustSeries.map(d => ({ time: d.t, thrust: d.y }));
  const avgWindow = 15;
  const thrustAvg = thrustView.map((_, i, arr) => {
    const slice = arr.slice(Math.max(0, i-avgWindow+1), i+1).map(x => x.thrust);
    const mean = slice.length ? slice.reduce((a,b)=>a+b,0)/slice.length : 0;
    return { time: arr[i].time, avg: mean };
  });

  return (
    <div className="app-wrap">
      {/* Title */}
      <div className="header"><h1>MISSION CONTROL</h1></div>

      {/* Navbar */}
      <NavBar active={activeTab} onChange={setActiveTab} />

      {/* Top-right floating ENV + inline HUD (no cards) */}
      <div className="pad-float glass panel">
        <PadEnvironment env={s.env} />

        {/* Inline global summary (no card) */}
        <div className="hud-inline">
          <span className={`dot ${globalDotClass}`} />
          <span className="summary">
            {armed ? "Armed" : "Disarmed"} • {pressureNominal ? "Pressures nominal" : "Pressure high"} •{" "}
            {camerasLive ? "Cameras live" : "Cameras offline"} • {recording ? "Recording ON" : "Recording OFF"}
          </span>
          <button
            className={`btn ${armed ? "primary" : "ghost"}`}
            style={{ padding: "6px 10px" }}
            onClick={() => setArmed(v => !v)}
          >
            {armed ? "ARMED" : "DISARMED"}
          </button>
          <button
            className={`btn ${recording ? "primary" : "ghost"}`}
            style={{ padding: "6px 10px" }}
            onClick={() => setRecording(v => !v)}
          >
            {recording ? "Recording ON" : "Recording OFF"}
          </button>
        </div>

        {/* Inline Interlocks chips + Advance (no card) */}
        <InterlocksState mode={mode} onNext={(m)=>setMode(m)} inline />
      </div>

      {activeTab === "overview" && (
        <div className="grid-12">
          {/* LEFT */}
          <div className="col-span-3">
            <div className="glass panel"><ConnectionsPanel connections={s.connections} /></div>
            <div className="glass panel" style={{marginTop:18}}><StatusPanel batteries={s.batteries} /></div>
            <div className="glass panel" style={{marginTop:18}}><BatteriesPanel batteries={s.batteries} /></div>
            <div className="glass panel" style={{marginTop:18}}><ValvesStatusPanel valves={s.valves} /></div>
            <div className="glass panel" style={{marginTop:18}}>
              <ExclusionEStop estop={{ connected: true, lastSelfTest: "Today 09:12", heartbeatSec: 2 }} />
            </div>
          </div>

          {/* CENTER */}
          <div className="col-span-4">
            <div className="glass panel">
              <TelemetryTiles pressures={s.pressures} tc={s.tc} nitrousFill={s.nitrousFill} onOpenGraph={openTileGraph} />
            </div>
            <div className="glass panel" style={{marginTop:18}}><TelemetryInfo /></div>
            <div className="glass panel" style={{marginTop:18}}>
              <PermissivesMatrix
                items={[
                  { key:"estop", label:"E-Stop OK", ok:true },
                  { key:"purge", label:"Purge Complete", ok:true },
                  { key:"pressures", label:"Pressures < Redline", ok:Math.max(...s.pressures) < 900 },
                  { key:"interlocks", label:"Interlocks Green", ok:armed },
                ]}
              />
            </div>
            {/* Interlocks card REMOVED from Overview as requested */}
          </div>

          {/* RIGHT */}
          <div className="col-span-5">
            {/* Thrust Profile */}
            <div className="glass panel chart-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div className="kicker">Thrust Profile</div>
                <div className="mono" style={{color:"var(--acc-1)",fontWeight:700}}>{Number(s.thrust).toFixed(1)} lbf</div>
              </div>
              <div style={{height:340}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={thrustView}>
                    <CartesianGrid stroke="rgba(255,255,255,.12)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tickFormatter={(t)=>new Date(t).toLocaleTimeString()} stroke="rgba(255,255,255,.5)" fontSize={12}/>
                    <YAxis stroke="rgba(255,255,255,.5)" fontSize={12}
                           label={{value:"lbf",angle:-90,position:"insideLeft",fill:"rgba(255,255,255,.6)"}}
                           allowDecimals={false}/>
                    <Tooltip contentStyle={{background:"rgba(12,16,24,.92)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12}}
                             labelFormatter={(t)=>new Date(t).toLocaleTimeString()}/>
                    <defs>
                      <linearGradient id="thrustFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#12b3ff" stopOpacity={0.65}/>
                        <stop offset="100%" stopColor="#12b3ff" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <Line type="monotone" data={thrustAvg} dataKey="avg" stroke="#7c9eff" strokeWidth={2} dot={false} isAnimationActive={false}/>
                    <Area type="monotone" dataKey="thrust" stroke="#12b3ff" strokeWidth={2.5} fill="url(#thrustFill)" isAnimationActive={false}/>
                    <ReferenceLine y={0} stroke="rgba(255,255,255,.25)"/>
                    <ReferenceLine y={800} stroke="rgba(255,93,93,.35)" strokeDasharray="6 6" label={{value:"Max Nominal",fill:"rgba(255,255,255,.6)"}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Nitrous + Press + Inventory + Redlines */}
            <div className="glass panel" style={{marginTop:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div className="kicker">Nitrous Tank</div>
                <div className="tag">{Math.round((s.nitrousFill ?? 0)*100)}% full</div>
              </div>
              <div className="progress" style={{marginBottom:12}}>
                <span style={{width:`${Math.round((s.nitrousFill ?? 0)*100)}%`}}/>
              </div>
              <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
                <button className="btn danger" onClick={ventNitrous}>VENT N₂O</button>
              </div>
            </div>

            <div className="glass panel" style={{marginTop:18}}>
              <PressurizationStatus press={s.press} />
            </div>

            <div className="glass panel" style={{marginTop:18}}>
              <PropInventory inv={s.inventory} />
            </div>

            <div className="glass panel" style={{marginTop:18}}>
              <RedlinesMonitor
                limits={[
                  { key:"pmax", label:"Pmax", unit:"psi", limit:900, value:Math.max(...s.pressures), ttt:"--" },
                  { key:"tmax", label:"Tmax", unit:"°C",  limit:350, value:s.tc, ttt:"--" },
                  { key:"thrust", label:"Thrust", unit:"lbf", limit:800, value:s.thrust, ttt:"--" },
                ]}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="col-span-12" style={{marginTop:18}}>
            <div className="glass panel" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="kicker">Engine Control Dashboard • Overview</div>
              <div className="kicker">WS: {WS_URL}</div>
            </div>
          </div>
        </div>
      )}

      {/* TELEMETRY TAB (Sensor Health here) */}
      {activeTab === "telemetry" && (
        <div className="grid-12">
          <div className="col-span-12">
            <div className="glass panel">
              <div className="kicker" style={{marginBottom:10}}>Sensor Health</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <HealthBadge label="P1" stat={health.p0}/> <HealthBadge label="P2" stat={health.p1}/>
                <HealthBadge label="P3" stat={health.p2}/> <HealthBadge label="P4" stat={health.p3}/>
                <HealthBadge label="P5" stat={health.p4}/> <HealthBadge label="P6" stat={health.p5}/>
                <HealthBadge label="TC" stat={health.tc}/> <HealthBadge label="N₂O" stat={health.nitrous}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMERAS TAB */}
      {activeTab === "cameras" && (
        <div className="grid-12">
          <div className="col-span-12">
            <div className="glass panel">
              <div className="kicker" style={{marginBottom:12}}>Camera Feeds</div>
              <CameraPanel connected={s.connections} />
            </div>
          </div>
          <div className="col-span-12" style={{marginTop:18}}>
            <div className="glass panel">
              <CameraHealth cams={s.cams} />
            </div>
          </div>
        </div>
      )}

      {/* CHECKLIST TAB (Run Timeline + Checklist + Procedures) */}
      {activeTab === "checklist" && (
        <div className="grid-12">
          <div className="col-span-6">
            <div className="glass panel"><RunTimeline timeline={timeline} onToggle={(key)=>setTimeline(t=>t.map(x=>x.key===key?{...x,done:!x.done}:x))} /></div>
            <div className="glass panel" style={{marginTop:18}}><ChecklistCard /></div>
            <div className="glass panel" style={{marginTop:18}}><ProcedureSnippets onSelect={(name)=>alert(`${name} queued`)} /></div>
          </div>
          <div className="col-span-6">
            <div className="glass panel">
              <InterlocksState mode={mode} onNext={(m)=>setMode(m)} />
            </div>
            <div className="glass panel" style={{marginTop:18}}>
              <PermissivesMatrix
                items={[
                  { key:"estop", label:"E-Stop OK", ok:true },
                  { key:"purge", label:"Purge Complete", ok:true },
                  { key:"pressures", label:"Pressures < Redline", ok:Math.max(...s.pressures) < 900 },
                  { key:"interlocks", label:"Interlocks Green", ok:armed },
                ]}
              />
            </div>
            <div className="glass panel" style={{marginTop:18}}>
              <ValveMap valves={s.valves} />
            </div>
          </div>
        </div>
      )}

      {/* LOGS TAB (Visual Anomaly Hints) */}
      {activeTab === "logs" && (
        <div className="grid-12">
          <div className="col-span-6">
            <div className="glass panel">
              <div className="kicker" style={{marginBottom:12}}>System Logs</div>
              <div className="tile">No logs yet. Hook your backend stream here.</div>
            </div>
          </div>
          <div className="col-span-6">
            <div className="glass panel">
              <VisualAnomalyHints hints={[{label:"Frost line", status:"Pending"},{label:"Vent plume", status:"OK"}]} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="glass panel">
          <div className="kicker" style={{marginBottom:12}}>Settings</div>
          <div className="tile">Add calibration, safety interlocks, theme, units, and WebSocket URL here.</div>
        </div>
      )}

      {modal && (
        <LiveChartModal
          title={modal.title}
          series={ modal.key==="tc" ? sensorSeries.tc :
                   modal.key==="nitrous" ? sensorSeries.nitrous :
                   sensorSeries[modal.key] || [] }
          units={ modal.key?.startsWith("p") ? "psi" : modal.key==="tc" ? "°C" : modal.key==="nitrous" ? "%" : "" }
          onClose={closeModal}
        />
      )}
    </div>
  );
}
