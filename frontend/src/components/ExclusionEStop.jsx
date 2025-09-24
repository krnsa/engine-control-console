import React from "react";

export default function ExclusionEStop({ estop={} }) {
  const { connected=true, lastSelfTest="Unknown", heartbeatSec="--" } = estop;
  return (
    <>
      <div className="kicker" style={{marginBottom:10}}>Exclusion & E-Stop</div>
      <div className="tile" style={{display:"grid",gap:8}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span>E-Stop Link</span>
          <span><span className={`dot ${connected?"ok":"bad"}`} /> <span className={`tag ${connected?"ok":"bad"}`}>{connected?"Connected":"Lost"}</span></span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Last Self-Test</span><span className="mono">{lastSelfTest}</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>Heartbeat Age</span><span className="mono">{heartbeatSec}s</span></div>
      </div>
    </>
  );
}
