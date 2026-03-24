// Author: Aditya Sharma
// Rutgers Rocket Propulsion Laboratory

import React, { useEffect, useState } from "react";
import "./App.css";
import "./index.css";

import NavBar from "./components/NavBar";
import OverviewPanel from "./components/OverviewPanel";
import ConnectionsPanel from "./components/ConnectionsPanel";
import GraphsPanel from "./components/GraphsPanel";
import CameraPanel from "./components/CameraPanel";
import CameraHealth from "./components/CameraHealth";
import ChecklistCard from "./components/ChecklistCard";
import RunTimeline from "./components/RunTimeline";
import LogsPanel from "./components/LogsPanel";
import SettingsPanel from "./components/SettingsPanel";

import {
  connectEngineSocket,
  subscribeEngineConnection,
  subscribeEngineState
} from "./engineSocket";

import ghostLogo from "../images/ghost.png";
import rplLogo from "../images/rpl.png";

function formatElapsedMmSs(totalSeconds) {
  if (typeof totalSeconds !== "number" || Number.isNaN(totalSeconds) || totalSeconds < 0) {
    return "--:--";
  }
  const whole = Math.floor(totalSeconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getInitialThemeMode() {
  if (typeof window === "undefined") return "night";
  return window.localStorage.getItem("mission-control-theme") || "night";
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [engineState, setEngineState] = useState(null);
  const [socketStatus, setSocketStatus] = useState({ connected: false });
  const [cameraStreamStatus, setCameraStreamStatus] = useState({});
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [activeCamera, setActiveCamera] = useState(null);
  const [clockText, setClockText] = useState("--:--:--");

  function openCamera(key) {
    if (key === "all") {
      setActiveCamera(null);
    } else {
      setActiveCamera(key);
    }
    setCameraModalOpen(true);
  }

  function closeCamera() {
    setCameraModalOpen(false);
    setActiveCamera(null);
  }

  function handleStreamStatus(cameraKey, isLive) {
    setCameraStreamStatus((prev) => ({ ...prev, [cameraKey]: isLive }));
  }

  useEffect(() => {
    if (cameraModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [cameraModalOpen]);

  useEffect(() => {
    connectEngineSocket();
    const unsubState = subscribeEngineState(setEngineState);
    const unsubConn = subscribeEngineConnection(setSocketStatus);
    return () => {
      unsubState?.();
      unsubConn?.();
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      setClockText(new Date().toLocaleTimeString());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    window.localStorage.setItem("mission-control-theme", themeMode);
  }, [themeMode]);

  const connections = {
    camera1: Boolean(engineState?.system?.cameras?.camera1 || cameraStreamStatus.camera1),
    camera2: Boolean(engineState?.system?.cameras?.camera2 || cameraStreamStatus.camera2),
    camera1Rotated: Boolean(
      engineState?.system?.cameras?.camera1 || cameraStreamStatus.camera1 || cameraStreamStatus.camera1Rotated
    ),
    camera2Rotated: Boolean(
      engineState?.system?.cameras?.camera2 || cameraStreamStatus.camera2 || cameraStreamStatus.camera2Rotated
    )
  };

  const sequence = engineState?.system?.sequence || {};
  const ignitors = engineState?.system?.ignitors || {};
  const ign1 = ignitors.ignitor1Connected;
  const ign2 = ignitors.ignitor2Connected;
  const ign1Fired = ignitors.ignitor1Fired === true;
  const ign2Fired = ignitors.ignitor2Fired === true;
  const continuityKnown = typeof ign1 === "boolean" && typeof ign2 === "boolean";
  const continuityGood = continuityKnown ? ign1 && ign2 : null;
  const continuityLabel = continuityKnown
    ? continuityGood
      ? "CONTINUITY OK"
      : "OPEN / FAULT"
    : "UNKNOWN";
  const continuityClass = continuityKnown ? (continuityGood ? "ok" : "bad") : "unknown";
  const ignitor1Label =
    typeof ign1 === "boolean" ? (ign1 ? "CONNECTED" : "DISCONNECTED") : "UNKNOWN";
  const ignitor2Label =
    typeof ign2 === "boolean" ? (ign2 ? "CONNECTED" : "DISCONNECTED") : "UNKNOWN";
  const ignitor1Class = typeof ign1 === "boolean" ? (ign1 ? "ok" : "bad") : "unknown";
  const ignitor2Class = typeof ign2 === "boolean" ? (ign2 ? "ok" : "bad") : "unknown";
  const ignitor1FiredLabel = ign1Fired ? "FIRED" : "NOT FIRED";
  const ignitor2FiredLabel = ign2Fired ? "FIRED" : "NOT FIRED";
  const ignitor1FiredClass = ign1Fired ? "ok" : "unknown";
  const ignitor2FiredClass = ign2Fired ? "ok" : "unknown";
  const sequenceCode = typeof sequence.code === "number" ? sequence.code : "--";
  const sequenceName = sequence.name || "--";
  const sequenceOnline = Boolean(sequence.online);
  const sequenceTimerSec =
    typeof sequence.plcTimerSec === "number"
      ? sequence.plcTimerSec
      : typeof sequence.timeInStateSec === "number"
      ? sequence.timeInStateSec
      : null;
  const sequenceTimer =
    typeof sequenceTimerSec === "number"
      ? `${sequenceTimerSec.toFixed(1)}s (${formatElapsedMmSs(sequenceTimerSec)})`
      : "--";
  const tank = engineState?.system?.tank || {};
  const massFlowLbmPerSec = typeof tank.massFlowLbmPerSec === "number" ? tank.massFlowLbmPerSec : null;
  const massFlowKgPerSec = typeof tank.massFlowKgPerSec === "number" ? tank.massFlowKgPerSec : null;
  const massFlowLbmText = massFlowLbmPerSec !== null ? `${massFlowLbmPerSec.toFixed(3)} lbm/s` : "--";
  const massFlowKgText = massFlowKgPerSec !== null ? `${massFlowKgPerSec.toFixed(3)} kg/s` : "--";

  return (
    <div className={`app-wrap overview-app-surface ${themeMode === "day" ? "theme-day" : "theme-night"}`}>
      <section className="hero">
        <img src={rplLogo} className="brand-left" alt="RPL logo" />
        <img src={ghostLogo} className="brand-right" alt="Ghost logo" />
      </section>

      <div className="header">
        <h1>MISSION CONTROL</h1>
      </div>

      <NavBar active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="overview-top-strip">
          <div className="overview-mini-card">
            <div className="kicker" style={{ textAlign: "left" }}>Mass Flow</div>
            <div className="overview-mini-value">{massFlowLbmText}</div>
          </div>
          <div className="overview-clock-block">
            <div className="clock-main">{clockText}</div>
            <div className="clock-sub">STATE TIME {sequenceTimer}</div>
          </div>
          <div className="overview-mini-card right">
            <div className="kicker" style={{ textAlign: "right" }}>Mass Flow</div>
            <div className="overview-mini-value">{massFlowKgText}</div>
          </div>
        </div>
      )}

      <div className="panel overview-panel-surface">
        {activeTab === "overview" && (
          <OverviewPanel
            state={engineState}
            ignitorStatus={{
              continuityLabel,
              continuityClass,
              ignitor1Label,
              ignitor2Label,
              ignitor1Class,
              ignitor2Class,
              ignitor1FiredLabel,
              ignitor2FiredLabel,
              ignitor1FiredClass,
              ignitor2FiredClass
            }}
          />
        )}
        {activeTab === "connections" && (
          <ConnectionsPanel
            system={engineState?.system || {}}
            socket={socketStatus}
            connections={{
              sensors: !!engineState?.system?.daqOnline,
              labjack: !!engineState?.system?.daqOnline,
              camera1: connections.camera1,
              camera2: connections.camera2
            }}
          />
        )}
        {activeTab === "graphs" && <GraphsPanel />}

        {activeTab === "cameras" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="cam-health-wrapper" style={{ width: "100%", maxWidth: 1200 }}>
              <CameraHealth connected={connections} onOpenCamera={openCamera} activeCamera={activeCamera} />
            </div>

            <div style={{ width: "100%", maxWidth: 1200 }}>
              <CameraPanel
                connected={connections}
                onOpenCamera={openCamera}
                activeCamera={activeCamera}
                cameraModalOpen={cameraModalOpen}
                onCloseCamera={closeCamera}
                onStreamStatus={handleStreamStatus}
              />
            </div>
          </div>
        )}

        {activeTab === "checklist" && (
          <div className="checklist-shell">
            <div className="checklist-col">
              <ChecklistCard />
            </div>
            <div className="checklist-col">
              <RunTimeline />
            </div>
          </div>
        )}

        {activeTab === "logs" && <LogsPanel state={engineState} socket={socketStatus} />}
        {activeTab === "settings" && (
          <SettingsPanel
            themeMode={themeMode}
            onThemeChange={setThemeMode}
          />
        )}
      </div>
    </div>
  );
}
