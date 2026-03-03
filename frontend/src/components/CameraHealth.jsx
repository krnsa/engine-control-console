import React from "react";

export default function CameraHealth({ connected = {}, onOpenCamera = () => {}, activeCamera = null }) {
  const cams = [
    { key: "all", label: "All Cams" },
    { key: "camera1", label: "Test Stand" },
    { key: "camera2", label: "Engine Chamber" },
    { key: "camera1Rotated", label: "Test Stand Rotated" },
    { key: "camera2Rotated", label: "Engine Chamber Rotated" }
  ];

  return (
    <div>
      <div className="kicker" style={{ marginBottom: 12, textAlign: "center" }}>Camera Feed Selector</div>

      <div className="cam-health-grid">
        {cams.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`cam-health-btn ${connected[c.key] ? "live" : ""} ${
              (c.key === "all" && activeCamera === null) || activeCamera === c.key ? "active" : ""
            }`}
            onClick={() => onOpenCamera(c.key)}
          >
            <div>{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
