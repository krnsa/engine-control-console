import React from "react";

export default function LogsPanel({ state, socket }) {
  const logging = state?.system?.logging || {};
  const csvLogging = logging.csv || {};
  const videoLogging = logging.video || {};
  const faults = Array.isArray(state?.faults) ? state.faults : [];
  const events = Array.isArray(state?.system?.eventStream) ? state.system.eventStream : [];
  const spares = state?.system?.spares || {};
  const backendConnected = Boolean(socket?.connected);
  const now = Date.now();

  const csvLastWrite = csvLogging.lastWrite || logging.lastWrite || null;
  const csvFreshMs = 5000;
  const csvFresh = typeof csvLastWrite === "number" && now - csvLastWrite <= csvFreshMs;
  const effectiveCsvOk = backendConnected && Boolean(csvLogging.ok) && csvFresh;
  const effectiveCsvActive = backendConnected && Boolean(csvLogging.active);

  const videoLastWrite = videoLogging.latestWrite || null;
  const effectiveVideoOk = backendConnected && Boolean(videoLogging.ok);
  const effectiveVideoReason = backendConnected
    ? videoLogging.reason ?? "--"
    : "BACKEND_OFFLINE";
  const effectiveLoggingActive = backendConnected && Boolean(logging.active);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="conn-grid">
        <div className="section no-bg">
          <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Data Logging</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <div className="tile" style={{ padding: 12, borderRadius: 12 }}>
                <div className="mono" style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>CSV LOGGING CHECK</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={`tag ${effectiveCsvOk ? "ok" : "bad"}`}>{effectiveCsvOk ? "OK" : "NOT OK"}</span>
                  <span className="mono" style={{ opacity: 0.8 }}>{effectiveCsvActive ? "ACTIVE" : "INACTIVE"}</span>
                </div>
              </div>

              <div className="tile" style={{ padding: 12, borderRadius: 12 }}>
                <div className="mono" style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>CAMERA LOGGING CHECK</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={`tag ${effectiveVideoOk ? "ok" : "bad"}`}>{effectiveVideoOk ? "OK" : "NOT OK"}</span>
                  <span className="mono" style={{ opacity: 0.8 }}>{effectiveVideoReason}</span>
                </div>
              </div>
            </div>

            <div className="conn-stack">
              <div className="conn-row">
                <div className="conn-label">Status</div>
                <span className={`tag ${effectiveLoggingActive ? "ok" : "bad"}`}>{effectiveLoggingActive ? "ACTIVE" : "INACTIVE"}</span>
              </div>
              <div className="conn-row">
                <div className="conn-label">CSV Logging Check</div>
                <span className={`tag ${effectiveCsvOk ? "ok" : "bad"}`}>{effectiveCsvOk ? "OK" : "NOT OK"}</span>
              </div>
              <div className="conn-row">
                <div className="conn-label">File</div>
                <span className="mono" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {csvLogging.filePath ?? logging.filePath ?? "--"}
                </span>
              </div>
              <div className="conn-row">
                <div className="conn-label">Last Write</div>
                <span className="mono">{(csvLogging.lastWrite || logging.lastWrite) ? new Date(csvLogging.lastWrite || logging.lastWrite).toLocaleTimeString() : "--"}</span>
              </div>
              <div className="conn-row">
                <div className="conn-label">Camera Logging Check</div>
                <span className={`tag ${effectiveVideoOk ? "ok" : "bad"}`}>{effectiveVideoOk ? "OK" : "NOT OK"}</span>
              </div>
              <div className="conn-row">
                <div className="conn-label">Video Directory</div>
                <span className="mono" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {videoLogging.directory ?? "--"}
                </span>
              </div>
              <div className="conn-row">
                <div className="conn-label">Latest Video File</div>
                <span className="mono" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {videoLogging.latestFile ?? "--"}
                </span>
              </div>
              <div className="conn-row">
                <div className="conn-label">Latest Video Write</div>
                <span className="mono">{videoLogging.latestWrite ? new Date(videoLogging.latestWrite).toLocaleTimeString() : "--"}</span>
              </div>
              <div className="conn-row">
                <div className="conn-label">Video Status Reason</div>
                <span className="tag">{effectiveVideoReason}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section no-bg">
          <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Faults</div>
          <div className="conn-stack">
            {faults.length ? (
              faults.map((fault, i) => (
                <div className="conn-row" key={`${fault}-${i}`}>
                  <div className="conn-label">{fault}</div>
                  <span className="tag bad">ACTIVE</span>
                </div>
              ))
            ) : (
              <div className="conn-row">
                <div className="conn-label" style={{ opacity: 0.75 }}>No active faults</div>
                <span className="tag ok">CLEAR</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section no-bg">
        <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Event Stream</div>
        <div className="conn-stack" style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
          {events.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {[...events].reverse().map((e, i) => (
                <div className="conn-row" key={`${e.ts}-${i}`}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <span className="mono" style={{ opacity: 0.7, fontSize: 12 }}>{new Date(e.ts).toLocaleTimeString()}</span>
                    <span>{e.message}</span>
                  </div>
                  <span className={`tag ${e.level === "error" ? "bad" : e.level === "warn" ? "" : "ok"}`}>{(e.source || "system").toUpperCase()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="conn-row">
              <div className="conn-label" style={{ opacity: 0.75 }}>No events yet</div>
              <span className="tag">IDLE</span>
            </div>
          )}
        </div>
      </div>

      <div className="section no-bg">
        <div className="kicker" style={{ marginBottom: 12, textAlign: "left" }}>Control I/O (Spare Lines)</div>
        <div className="conn-stack">
          {[
            { key: "spare1", label: "Arduino Command Out" },
            { key: "spare2", label: "PLC Command In" },
            { key: "spare3", label: "PLC Interlock OK" },
            { key: "spare4", label: "PLC Command Return" }
          ].map((item) => (
            <div className="conn-row" key={item.key}>
              <span className="mono">{item.label}</span>
              <span className="tag">{spares[item.key] === null || spares[item.key] === undefined ? "--" : spares[item.key] ? "HIGH" : "LOW"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
