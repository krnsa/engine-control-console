import React from 'react';

// Small placeholder for VisualAnomalyHints used in App.jsx.
// Accepts `hints` prop: array of { label, status } and renders a compact list.
export default function VisualAnomalyHints({ hints = [] }) {
  return (
    <div className="tile" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="kicker">Visual Anomalies</div>
        <div className="mono" style={{ opacity: 0.9 }}>{hints.length}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hints && hints.length ? (
          hints.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 14 }}>{h.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: h.status === 'OK' ? '#10b981' : (h.status === 'Pending' ? '#f59e0b' : '#ef4444') }}>
                {h.status}
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>No visual hints</div>
        )}
      </div>
    </div>
  );
}
