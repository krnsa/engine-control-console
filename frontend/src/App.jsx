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
import BrandImages from "./components/BrandImages";

import {
  connectEngineSocket,
  subscribeEngineConnection,
  subscribeEngineState
} from "./engineSocket";

import ghostLogo from "../images/ghost.png";
import rplLogo from "../images/rpl.png";

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [engineState, setEngineState] = useState(null);
  const [socketStatus, setSocketStatus] = useState({ connected: false });

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [activeCamera, setActiveCamera] = useState(null);

  function openCamera(key) {
    setActiveCamera(key);
    setCameraModalOpen(true);
  }

  function closeCamera() {
    setCameraModalOpen(false);
    setActiveCamera(null);
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

  const connections = {
    camera1: !!engineState?.system?.cameras?.camera1,
    camera2: !!engineState?.system?.cameras?.camera2,
    camera3: !!engineState?.system?.cameras?.camera3
  };

  return (
    <div className="app-wrap">
      <BrandImages left={rplLogo} right={ghostLogo} />

      <div className="header">
        <h1>MISSION CONTROL</h1>
      </div>

      <NavBar active={activeTab} onChange={setActiveTab} />

      <div className="panel">
        {activeTab === "overview" && <OverviewPanel state={engineState} />}
        {activeTab === "connections" && (
          <ConnectionsPanel
            system={engineState?.system || {}}
            socket={socketStatus}
            connections={{
              sensors: !!engineState?.system?.daqOnline,
              labjack: !!engineState?.system?.daqOnline,
              camera1: connections.camera1,
              camera2: connections.camera2,
              camera3: connections.camera3
            }}
          />
        )}
        {activeTab === "graphs" && <GraphsPanel />}

        {activeTab === "cameras" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", maxWidth: 1200 }}>
              <CameraPanel
                connected={connections}
                onOpenCamera={openCamera}
                activeCamera={activeCamera}
                cameraModalOpen={cameraModalOpen}
                onCloseCamera={closeCamera}
              />
            </div>

            <div className="cam-health-wrapper" style={{ width: "100%", maxWidth: 1200 }}>
              <CameraHealth connected={connections} onOpenCamera={openCamera} activeCamera={activeCamera} />
            </div>
          </div>
        )}

        {activeTab === "checklist" && (
          <div className="grid-12">
            <ChecklistCard />
            <RunTimeline />
          </div>
        )}

        {activeTab === "logs" && <LogsPanel state={engineState} />}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
