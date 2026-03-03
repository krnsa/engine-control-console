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

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [engineState, setEngineState] = useState(null);
  const [socketStatus, setSocketStatus] = useState({ connected: false });
  const [cameraStreamStatus, setCameraStreamStatus] = useState({});

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

  return (
    <div className="app-wrap">
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
          <div className="overview-clock-block">
            <div className="clock-main">{clockText}</div>
            <div className="clock-sub">STATE TIME {sequenceTimer}</div>
          </div>
        </div>
      )}

      <div className="panel">
        {activeTab === "overview" && (
          <OverviewPanel
            state={engineState}
            ignitorStatus={{
              continuityLabel,
              continuityClass,
              ignitor1Label,
              ignitor2Label,
              ignitor1Class,
              ignitor2Class
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
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
