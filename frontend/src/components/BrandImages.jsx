import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Render images into a top-level fixed overlay container appended to the documentElement.
// This avoids movement caused by transformed/scrollable ancestors.
export default function BrandImages({ left, right }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    // Create a top-level container attached to documentElement (html) to reduce chance
    // of being affected by transforms on body or other elements.
    const c = document.createElement("div");
    c.setAttribute("id", "brand-images-root");
    // Full-viewport fixed container
    c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
    document.documentElement.appendChild(c);
    containerRef.current = c;

    return () => {
      try { document.documentElement.removeChild(c); } catch (e) { /* ignore */ }
    };
  }, []);

  if (typeof document === "undefined" || !containerRef.current) return null;

  const node = (
    <>
      <img
        src={left}
        alt="ghost"
        style={{
          position: "absolute",
          left: 12,
          top: 8,
          maxWidth: 96,
          height: "auto",
          pointerEvents: "none",
          opacity: 0.95,
        }}
      />
      <img
        src={right}
        alt="rpl"
        style={{
          position: "absolute",
          right: 12,
          top: 8,
          maxWidth: 140,
          height: "auto",
          pointerEvents: "none",
          opacity: 0.95,
        }}
      />
    </>
  );

  return createPortal(node, containerRef.current);
}
