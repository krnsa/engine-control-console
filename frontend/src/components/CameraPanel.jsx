import React from "react";

export default function CameraPanel({ connected={} }){
  return (
    <div className="cams">
      <div className="cam">
        <div className="label">Cam A {connected.camera1 ? "• LIVE" : "• OFF"}</div>
        {/* <video src="..." autoPlay muted /> */}
      </div>
      <div className="cam">
        <div className="label">Cam B {connected.camera2 ? "• LIVE" : "• OFF"}</div>
      </div>
      <div className="cam">
        <div className="label">Cam C {connected.camera3 ? "• LIVE" : "• OFF"}</div>
      </div>
    </div>
  );
}
