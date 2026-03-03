import React, { useMemo, useRef } from "react";
import TankGaugeCanvas from "./TankGaugeCanvas";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function TankCard({
  tankLbf,
  fluidWeightLbf,
  tareWeightLbf,
  fluidMaxLbf,
  maxTankLbf = 220.46,
  fluidLabel = "N2O",
  gaugeMinLbf = 0,
  gaugeMaxLbf = 100,
  autoScaleEnabled = true,
  autoScaleStartLbf = 90,
  autoScaleStepTriggerLbf = 10,
  autoScaleStepSizeLbf = 25
}) {
  const peakRef = useRef(null);
  const hasTotalReading = typeof tankLbf === "number";
  const totalLoad = Math.max(0, Math.min(maxTankLbf, hasTotalReading ? tankLbf : 0));
  const hasFluidReading = typeof fluidWeightLbf === "number";
  const fluidWeight = Math.max(0, hasFluidReading ? fluidWeightLbf : 0);
  const hasTareReading = typeof tareWeightLbf === "number";
  const tareWeight = hasTareReading ? tareWeightLbf : null;
  const hasFluidMax = typeof fluidMaxLbf === "number" && fluidMaxLbf > 0;

  if (hasTotalReading) {
    peakRef.current = typeof peakRef.current === "number" ? Math.max(peakRef.current, totalLoad) : totalLoad;
  }
  const autoSteps =
    autoScaleEnabled && hasFluidReading && fluidWeight > autoScaleStartLbf
      ? Math.floor((fluidWeight - autoScaleStartLbf) / Math.max(1, autoScaleStepTriggerLbf)) + 1
      : 0;

  const fluidBasedGaugeMax = hasFluidMax ? Math.max(gaugeMaxLbf, fluidMaxLbf * 1.2) : null;
  const dynamicGaugeMax = fluidBasedGaugeMax ?? (gaugeMaxLbf + autoSteps * autoScaleStepSizeLbf);
  const gaugeSpan = Math.max(1, dynamicGaugeMax - gaugeMinLbf);
  const fill01 = clamp((fluidWeight - gaugeMinLbf) / gaugeSpan, 0, 1);
  const scaleTicks = [dynamicGaugeMax, dynamicGaugeMax * 0.75, dynamicGaugeMax * 0.5, dynamicGaugeMax * 0.25, gaugeMinLbf]
    .map((v) => Math.round(v));

  const trend = useMemo(() => (hasFluidReading ? "LIVE" : "--"), [hasFluidReading]);

  return (
    <div className="tankCardWrap">
      <div className="tankCardHead">
        <div className="leftHdr">
          <div className="small">LOAD CELL 2</div>
          <h2 className="big">TANK LOAD</h2>
        </div>
        <div className="hdrChips">
          <div className="pill" style={{ borderColor: "rgba(47,185,255,.22)" }}>
            FILL <b>{hasFluidReading ? Math.round(fill01 * 100) : "--"}</b>{hasFluidReading ? "%" : ""}
          </div>
          <div className="pill">
            FLUID <b>{fluidLabel}</b>
          </div>
          <div className="pill">
            SCALE <b>{Math.round(gaugeMinLbf)}-{Math.round(dynamicGaugeMax)}</b>
          </div>
        </div>
      </div>

      <div className="tankCard">
        <div className="tankViz">
          <TankGaugeCanvas fill01={fill01} />
          <div className="glassFrame" />
          <div className="scale">
            {scaleTicks.map((tick) => (
              <span key={tick}>{tick}<i /></span>
            ))}
          </div>
        </div>

        <div className="tankStats">
          <div className="statBox">
            <div className="t">Fluid</div>
            <div className="v blue">{hasFluidReading ? fluidWeight.toFixed(2) : "--"} LBF</div>
          </div>

          <div className="statBox">
            <div className="t">Trend</div>
            <div className="v">{trend}</div>
          </div>

          <div className="statBox">
            <div className="t">Total Load</div>
            <div className="v blue">{hasTotalReading ? totalLoad.toFixed(2) : "--"} LBF</div>
          </div>

          <div className="statBox">
            <div className="t">Tare</div>
            <div className="v blue">{typeof tareWeight === "number" ? tareWeight.toFixed(2) : "--"} LBF</div>
          </div>

          <div className="statBox">
            <div className="t">Peak Total</div>
            <div className="v blue">{typeof peakRef.current === "number" ? peakRef.current.toFixed(2) : "--"} LBF</div>
          </div>
        </div>
      </div>
    </div>
  );
}
