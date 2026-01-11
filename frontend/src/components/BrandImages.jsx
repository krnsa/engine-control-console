import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function BrandImages({ left, right }) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({
    leftX: 8,
    rightX: 16,
    bottom: 8,
    leftBottom: -24,
    size: 96
  });

  // Create fixed overlay container ONCE
  useEffect(() => {
    const c = document.createElement("div");
    c.id = "brand-images-root";
    c.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:50;";
    document.documentElement.appendChild(c);
    containerRef.current = c;

    return () => {
      document.documentElement.removeChild(c);
    };
  }, []);

  // Compute position ON LOAD + RESIZE ONLY (bottom-left / bottom-right anchors)
  useEffect(() => {
    function compute() {
      const vw = window.innerWidth;

      // Responsive size: slightly larger on wider screens
      let size = 96;
      if (vw >= 1500) size = 140;
      else if (vw >= 1200) size = 110;
      else size = 96;

      // Inset from screen edges
      const inset = Math.max(12, Math.round(size * 0.12));

      // Move left logo tighter into the corner and lower it closer to the bottom
      const leftX = 8; // closer to bottom-left corner
      const rightX = Math.max(inset, vw - size - inset); // bottom-right anchor x
      const bottom = 8; // pixels from bottom for right logo
      const leftBottom = -38; // pixels from bottom for left logo (may extend beyond viewport)

      setPos({ leftX, rightX, bottom, leftBottom, size });
    }

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  if (!containerRef.current) return null;

  return createPortal(
    <>
      <img
        src={left}
        alt="left-logo"
        style={{
          position: "absolute",
          left: pos.leftX,
          bottom: pos.leftBottom ?? pos.bottom,
          width: pos.size,
          height: pos.size,
          objectFit: "contain",
          opacity: 0.95,
          pointerEvents: "none"
        }}
      />
      <img
        src={right}
        alt="right-logo"
        style={{
          position: "absolute",
          left: pos.rightX,
          bottom: pos.bottom,
          width: pos.size,
          height: pos.size,
          objectFit: "contain",
          opacity: 0.95,
          pointerEvents: "none"
        }}
      />
    </>,
    containerRef.current
  );
}
