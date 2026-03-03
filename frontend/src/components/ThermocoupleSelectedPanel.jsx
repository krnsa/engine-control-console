import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function convertFromC(valueC, unit) {
  if (typeof valueC !== "number") return null;
  if (unit === "F") return (valueC * 9) / 5 + 32;
  if (unit === "K") return valueC + 273.15;
  return valueC;
}

export default function ThermocoupleSelectedPanel({ tempC = null, limitC = 350 }) {
  const lastTempRef = useRef(null);
  const lastTsRef = useRef(null);
  const [rateCps, setRateCps] = useState(null);
  const [peakC, setPeakC] = useState(null);
  const [unit, setUnit] = useState("C");

  useEffect(() => {
    const now = Date.now();
    if (typeof tempC === "number") {
      setPeakC((prev) => (typeof prev === "number" ? Math.max(prev, tempC) : tempC));
    }

    if (typeof tempC === "number" && typeof lastTempRef.current === "number" && typeof lastTsRef.current === "number") {
      const dtSec = Math.max(0.001, (now - lastTsRef.current) / 1000);
      const rate = (tempC - lastTempRef.current) / dtSec;
      setRateCps(rate);
    } else if (typeof tempC !== "number") {
      setRateCps(null);
    }

    lastTempRef.current = typeof tempC === "number" ? tempC : lastTempRef.current;
    lastTsRef.current = now;
  }, [tempC]);

  const scaleMaxC = useMemo(() => {
    const reading = typeof tempC === "number" ? tempC : 0;
    const peak = typeof peakC === "number" ? peakC : 0;
    return Math.max(limitC, peak, reading, 1);
  }, [tempC, peakC, limitC]);

  const pct = clamp((typeof tempC === "number" ? tempC : 0) / scaleMaxC, 0, 1);
  const limitPct = clamp(limitC / scaleMaxC, 0, 1);

  const displayTemp = convertFromC(tempC, unit);
  const displayLimit = convertFromC(limitC, unit);
  const displayPeak = typeof peakC === "number" ? convertFromC(peakC, unit) : null;
  const displayRate = typeof rateCps === "number" ? convertFromC(rateCps, unit) : null;

  const legendMid = convertFromC(scaleMaxC / 2, unit);
  const legendMax = convertFromC(scaleMaxC, unit);

  let state = { label: "OFFLINE", cls: "off" };
  if (typeof tempC === "number") {
    state = { label: "SAFE", cls: "safe" };
    if (tempC >= limitC) state = { label: "LIMIT", cls: "limit" };
    else if (tempC >= limitC * 0.9) state = { label: "HOT", cls: "hot" };
  }

  return (
    <div className="tcPanel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          <div className="kicker">THERMOCOUPLE</div>
          <div className="kicker tt1-large" style={{ marginTop: 4 }}>TT-1</div>
        </div>
        <div className="metaRow">
          <select className="temp-unit-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="C">C</option>
            <option value="F">F</option>
            <option value="K">K</option>
          </select>
          <div className="pill">LIMIT <b>{Math.round(displayLimit ?? 0)}</b> °{unit}</div>
          <div className="pill">PEAK <b>{typeof displayPeak === "number" ? Math.round(displayPeak) : "--"}</b> °{unit}</div>
        </div>
      </div>

      <div className="tcBigReadout">
        <div className="tcBigNum">
          <div className="tcNum">{typeof displayTemp === "number" ? Math.round(displayTemp) : "--"}</div>
          <div className="tcUnit">°{unit}</div>
        </div>

        <div className="tcBigRight">
          <div className="tcLine">RATE <b>{typeof displayRate === "number" ? displayRate.toFixed(1) : "--"}</b> °{unit}/S</div>
          <div className={`state ${state.cls}`}>{state.label}</div>
        </div>
      </div>

      <div className="tcStrip">
        <div className="tcStripBar">
          <div className="tcStripFill" style={{ width: `${(pct * 100).toFixed(1)}%` }} />
          {typeof tempC === "number" ? (
            <div className="tcLimitMarker" style={{ left: `calc(${(limitPct * 100).toFixed(2)}% - 1px)` }} title="limit" />
          ) : null}
        </div>

        <div className="tcLegend">
          <span>0</span>
          <span>{Math.round(legendMid ?? 0)}</span>
          <span>{Math.round(legendMax ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}
