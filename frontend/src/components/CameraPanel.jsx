import React, { useState } from "react";

export default function CameraPanel({
  connected = {},
  onOpenCamera = () => {},
  activeCamera = null,
  cameraModalOpen = false,
  onCloseCamera = () => {}
}) {
  const cams = [
    { key: "camera1", label: "Camera A" },
    { key: "camera2", label: "Camera B" },
    { key: "camera3", label: "Camera C" }
  ];

  const [viewMode, setViewMode] = useState("all"); // "all" | "single"

  return (
    <>
      {/* COLLAPSED GRID */}
      {!cameraModalOpen && (
        <div className="cams-large">
          {cams.map(cam => (
            <button
              key={cam.key}
              className="cam-large"
              onClick={() => onOpenCamera(cam.key)}
            >
              <div className="conn-label">
                {cam.label}
                <div className="conn-detail">
                  {connected[cam.key] ? "LIVE" : "OFF"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FULLSCREEN MODAL */}
      {cameraModalOpen && (
        <div className="camera-modal">
          <div className="camera-modal-inner fullscreen">

            {/* HEADER */}
            <div className="camera-modal-header">
              <div className="conn-label">
                Cameras
                <div className="conn-detail">
                  {viewMode === "all" ? "ALL FEEDS" : "FOCUSED"}
                </div>
              </div>

              <div className="camera-modal-controls">
                <button
                  className={`cam-toggle ${viewMode === "all" ? "active" : ""}`}
                  onClick={() => setViewMode("all")}
                >
                  ALL
                </button>
                <button
                  className={`cam-toggle ${viewMode === "single" ? "active" : ""}`}
                  onClick={() => setViewMode("single")}
                >
                  ONE
                </button>
                <button className="camera-modal-close" onClick={onCloseCamera}>
                  Close
                </button>
              </div>
            </div>

            {/* GRID */}
            <div className={`camera-modal-grid ${viewMode}`}>
              {cams.map(cam => {
                const isVisible =
                  viewMode === "all" || activeCamera === cam.key;

                return (
                  <div
                    key={cam.key}
                    className={`feed-box ${
                      activeCamera === cam.key ? "feed-active" : ""
                    }`}
                    style={{ display: isVisible ? "flex" : "none" }}
                  >
                    <div className="feed-label">
                      {cam.label} — {connected[cam.key] ? "LIVE" : "OFF"}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
