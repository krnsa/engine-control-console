import React, { useEffect, useState } from "react";

const CHECKLIST_STORAGE_KEY = "rpl_pre_fire_checklist_v1";

const DEFAULT_ITEMS = [
  { k:"leak", label:"Leak check complete", done:false },
  { k:"igniter", label:"Igniter continuity OK", done:false },
  { k:"cams", label:"Cameras set & recording", done:false },
  { k:"shields", label:"Shields in place", done:false },
];

function loadSavedItems() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return DEFAULT_ITEMS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ITEMS;
    const doneMap = new Map(parsed.map((i) => [i?.k, Boolean(i?.done)]));
    return DEFAULT_ITEMS.map((item) => ({ ...item, done: doneMap.get(item.k) || false }));
  } catch {
    return DEFAULT_ITEMS;
  }
}

export default function ChecklistCard() {
  const [items, setItems] = useState(loadSavedItems);

  useEffect(() => {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const setAll = (done) => setItems((prev) => prev.map((x) => ({ ...x, done })));

  return (
    <div className="checklist-card">
      <div className="checklist-head">
        <div className="kicker">Pre-Fire Checklist</div>
        <div className="checklist-meta">
          <span className="mono">{doneCount}/{total} COMPLETE</span>
          <span className="tag ok">{pct}%</span>
        </div>
      </div>

      <div className="progress checklist-progress" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="checklist-items">
        {items.map((i) => (
          <label key={i.k} className="checklist-item">
            <span className="checklist-item-left">
              <input
                type="checkbox"
                checked={i.done}
                onChange={() => setItems((s) => s.map((x) => (x.k === i.k ? { ...x, done: !x.done } : x)))}
              />
              <span className="checklist-label">{i.label}</span>
            </span>
            <span className={`tag ${i.done ? "ok" : "warn"}`}>{i.done ? "OK" : "TODO"}</span>
          </label>
        ))}
      </div>

      <div className="checklist-actions">
        <button className="btn ghost checklist-btn" onClick={() => setAll(false)}>Clear</button>
        <button className="btn primary checklist-btn" onClick={() => setAll(true)}>Mark All</button>
      </div>
    </div>
  );
}
