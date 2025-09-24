import React from "react";
const GLASS = "bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]";

export default function MissionHeader({ controller, batteries }) {
  return (
  <header className="px-8 py-6 flex items-center justify-between">
  <h1 className="text-4xl md:text-6xl font-black tracking-widest uppercase">MISSION CONTROL</h1>
  <div className={`${GLASS} px-4 py-3 flex items-center gap-6`}>
    <div>
      <div className="kicker">Controller</div>
      <div className={`text-sm font-semibold ${controller==="Connected" ? "text-emerald-300":"text-rose-300"}`}>
        {controller}
      </div>
    </div>
    <div className="w-px h-8 bg-white/10" />
    <div>
      <div className="kicker">Batteries</div>
      <div className="text-xs">{`Teensy ${batteries?.teensy?.toFixed?.(1) ?? "-"} V • LJT7 ${batteries?.labjack?.toFixed?.(2) ?? "-" } V`}</div>
    </div>
  </div>
</header>

  );
}