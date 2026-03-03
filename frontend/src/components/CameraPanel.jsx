import React, { useEffect, useMemo, useState } from "react";

export default function CameraPanel({
  connected = {},
  onOpenCamera = () => {},
  activeCamera = null,
  cameraModalOpen = false,
  onCloseCamera = () => {},
  onStreamStatus = () => {}
}) {
  const cams = [
    {
      key: "camera1Rotated",
      label: "Test Stand Rotated",
      streamUrl: "http://localhost:8889/cam1?webrtc=1",
      statusKey: "camera1",
      rotateContainer: true
    },
    {
      key: "camera2Rotated",
      label: "Engine Chamber Rotated",
      streamUrl: "http://localhost:8889/cam2?webrtc=1",
      statusKey: "camera2",
      rotateContainer: true
    },
    { key: "camera1", label: "Test Stand", streamUrl: "http://localhost:8889/cam1", statusKey: "camera1" },
    { key: "camera2", label: "Engine Chamber", streamUrl: "http://localhost:8889/cam2", statusKey: "camera2" }
  ];

  const [viewMode, setViewMode] = useState("all");
  const [streamLive, setStreamLive] = useState({});
  const [fullscreenKey, setFullscreenKey] = useState(null);

  useEffect(() => {
    if (!cameraModalOpen) return;
    if (activeCamera) {
      setViewMode("single");
    } else {
      setViewMode("all");
    }
  }, [cameraModalOpen, activeCamera]);

  useEffect(() => {
    if (!fullscreenKey) {
      return undefined;
    }

    const onKeyDown = (ev) => {
      if (ev.key === "Escape") {
        setFullscreenKey(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreenKey]);

  function updateStreamLive(cam, isLive) {
    setStreamLive((prev) => {
      if (prev[cam.key] === isLive && prev[cam.statusKey] === isLive) {
        return prev;
      }
      return {
        ...prev,
        [cam.key]: isLive,
        [cam.statusKey]: isLive
      };
    });
    onStreamStatus(cam.key, isLive);
    onStreamStatus(cam.statusKey, isLive);
  }

  const statusMap = useMemo(() => {
    const next = {};
    cams.forEach((cam) => {
      next[cam.key] = Boolean(
        connected[cam.key] || connected[cam.statusKey] || streamLive[cam.key] || streamLive[cam.statusKey]
      );
    });
    return next;
  }, [cams, connected, streamLive]);

  return (
    <>
      {!cameraModalOpen && (
        <div className="cams-large">
          {cams.map((cam) => (
            <button
              key={cam.key}
              className={`cam-large ${cam.rotateContainer ? "cam-large-rotated" : ""}`}
              onClick={() => onOpenCamera(cam.key)}
            >
              <div className="cam-large-inner">
                <div className="conn-label">
                  {cam.label}
                  <div className="conn-detail">{statusMap[cam.key] ? "LIVE" : "OFF"}</div>
                </div>
                {cam.rotateContainer ? (
                  <button
                    type="button"
                    className="cam-rotate-full-btn"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setFullscreenKey(cam.key);
                    }}
                  >
                    FULL
                  </button>
                ) : null}
                {cam.streamUrl ? (
                  <iframe
                    title={`${cam.label} stream`}
                    className="feed-embed"
                    src={cam.streamUrl}
                    allow="autoplay; fullscreen; picture-in-picture"
                    referrerPolicy="no-referrer"
                    onLoad={() => updateStreamLive(cam, true)}
                    onError={() => updateStreamLive(cam, false)}
                  />
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {cameraModalOpen && (
        <div className="camera-modal">
          <div className="camera-modal-inner fullscreen">
            <div className="camera-modal-header">
              <div className="conn-label">
                Cameras
                <div className="conn-detail">{viewMode === "all" ? "ALL FEEDS" : "FOCUSED"}</div>
              </div>

              <div className="camera-modal-controls">
                {activeCamera ? (
                  <button className="cam-toggle" onClick={() => setFullscreenKey(activeCamera)}>
                    FULL SCREEN
                  </button>
                ) : null}
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
                <button className="camera-modal-close danger" onClick={onCloseCamera} aria-label="Close camera modal">
                  X
                </button>
              </div>
            </div>

            <div className={`camera-modal-grid ${viewMode}`}>
              {cams.map((cam) => {
                const isVisible = viewMode === "all" || activeCamera === cam.key;

                return (
                  <div
                    key={cam.key}
                    className={`feed-box ${cam.rotateContainer ? "feed-box-rotated" : ""} ${
                      activeCamera === cam.key ? "feed-active" : ""
                    }`}
                    style={{ display: isVisible ? "flex" : "none" }}
                  >
                    <div className="feed-box-inner">
                      <div className="feed-label">
                        {cam.label} - {statusMap[cam.key] ? "LIVE" : "OFF"}
                      </div>
                      {cam.streamUrl ? (
                        <iframe
                          title={`${cam.label} stream`}
                          className="feed-embed"
                          src={cam.streamUrl}
                          allow="autoplay; fullscreen; picture-in-picture"
                          referrerPolicy="no-referrer"
                          onLoad={() => updateStreamLive(cam, true)}
                          onError={() => updateStreamLive(cam, false)}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {fullscreenKey && (
        <div className="rotated-fullscreen" onClick={() => setFullscreenKey(null)}>
          <div className="rotated-fullscreen-stage" onClick={(ev) => ev.stopPropagation()}>
            <button
              type="button"
              className="rotated-fullscreen-close"
              onClick={() => setFullscreenKey(null)}
            >
              Close
            </button>
            <iframe
              title={`${cams.find((cam) => cam.key === fullscreenKey)?.label || "Camera"} Fullscreen`}
              className={`rotated-fullscreen-embed ${cams.find((cam) => cam.key === fullscreenKey)?.rotateContainer ? "rotated" : ""}`}
              src={cams.find((cam) => cam.key === fullscreenKey)?.streamUrl || ""}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </>
  );
}
