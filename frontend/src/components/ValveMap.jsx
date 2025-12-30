import React from "react";

// Simple placeholder ValveMap component. Renders a compact grid of valves
// with a colored pill indicating open/closed state. Keeps styling minimal
// so it blends with existing dashboard tiles.
export default function ValveMap({ valves = [] }) {
  return (
    <div className="tile" style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="kicker">Valve Map</div>
        <div className="mono" style={{ opacity: 0.85 }}>{valves.length} valves</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
        {valves && valves.length ? (
          valves.map((v, i) => {
            const open = !!v.open;
            const bg = open ? "linear-gradient(180deg,#115e59,#10b981)" : "linear-gradient(180deg,#2b2b2b,#1f2937)";
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.03)'
              }}>
                <div style={{ fontSize: 13 }}>{v.name ?? `V${i}`}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: open ? '#10b981' : '#374151',
                    boxShadow: open ? '0 0 8px rgba(16,185,129,0.25)' : 'none'
                  }} />
                  <div style={{ fontSize: 12, opacity: 0.9 }}>{open ? 'OPEN' : 'CLOSED'}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.6)', padding: 8 }}>No valve data</div>
        )}
      </div>
    </div>
  );
}
