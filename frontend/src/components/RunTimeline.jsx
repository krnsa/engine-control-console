import React, { useEffect, useMemo, useState } from "react";

const TIMELINE_STORAGE_KEY = "rpl_run_timeline_v1";

const DEFAULT_TIMELINE = [
  { key: "t120", label: "T-120s: Final safety sweep", done: false },
  { key: "t60", label: "T-60s: Arm ignition circuit", done: false },
  { key: "t30", label: "T-30s: Pressurization hold verify", done: false },
  { key: "t10", label: "T-10s: Auto-sequence handoff", done: false },
  { key: "t0", label: "T-0s: Ignition + valve open", done: false },
  { key: "t10p", label: "T+10s: Shutdown and safing", done: false }
];

function loadSavedTimeline() {
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
    if (!raw) return DEFAULT_TIMELINE;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_TIMELINE;
    const doneMap = new Map(parsed.map((i) => [i?.key, Boolean(i?.done)]));
    return DEFAULT_TIMELINE.map((item) => ({ ...item, done: doneMap.get(item.key) || false }));
  } catch {
    return DEFAULT_TIMELINE;
  }
}

export default function RunTimeline({ timeline = [], onToggle = () => {} }) {
  const hasExternal = timeline.length > 0;
  const [localTimeline, setLocalTimeline] = useState(loadSavedTimeline);
  const rows = hasExternal ? timeline : localTimeline;
  const doneCount = rows.filter((r) => r.done).length;
  const pct = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;

  useEffect(() => {
    if (!hasExternal) {
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(localTimeline));
    }
  }, [hasExternal, localTimeline]);

  const toggle = useMemo(
    () => (key) => {
      if (hasExternal) {
        onToggle(key);
        return;
      }
      setLocalTimeline((prev) => prev.map((r) => (r.key === key ? { ...r, done: !r.done } : r)));
    },
    [hasExternal, onToggle]
  );

  return (
    <div className="checklist-card">
      <div className="checklist-head">
        <div className="kicker">Run Timeline / Countdown</div>
        <div className="checklist-meta">
          <span className="mono">{doneCount}/{rows.length} COMPLETE</span>
          <span className="tag ok">{pct}%</span>
        </div>
      </div>

      <div className="progress checklist-progress" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="checklist-items">
        {rows.map((t) => (
          <label key={t.key} className="checklist-item">
            <span className="checklist-item-left">
              <input type="checkbox" checked={!!t.done} onChange={() => toggle(t.key)} />
              <span className="checklist-label">{t.label}</span>
            </span>
            <span className={`tag ${t.done ? "ok" : "warn"}`}>{t.done ? "DONE" : "PENDING"}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
