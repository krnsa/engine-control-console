import React from "react";

export default function CameraHealth({ connected = {}, onOpenCamera = () => {}, activeCamera = null }) {
  const cams = [
    { key: "camera1", label: "Cam 1" },
    { key: "camera2", label: "Cam 2" },
    { key: "camera3", label: "Cam 3" }
  ];

  return (
    <div>
      <div className="kicker" style={{ marginBottom: 12, textAlign: "center" }}>Camera Health</div>

      <div className="cam-health-grid">
        {cams.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`cam-health-btn ${connected[c.key] ? "live" : ""} ${activeCamera === c.key ? "active" : ""}`}
            onClick={() => onOpenCamera(c.key)}
          >
            <div>{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
