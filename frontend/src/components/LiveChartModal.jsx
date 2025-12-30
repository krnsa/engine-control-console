// frontend/src/components/LiveChartModal.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function LiveChartModal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    // Prevent background scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  };

  const cardStyle = {
    width: "min(1200px, 96vw)",
    height: "min(720px, 86vh)",
    background: "rgba(24, 28, 35, 0.96)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  };

  const titleStyle = {
    margin: 0,
    fontSize: "14px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
  };

  const closeBtnStyle = {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
    lineHeight: "18px",
  };

  const bodyStyle = {
    flex: 1,
    padding: 16,
    minHeight: 0, // critical so chart containers can size correctly
  };

  function onBackdropClick(e) {
    // only close if they clicked the backdrop, not the card
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div style={overlayStyle} onMouseDown={onBackdropClick}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
