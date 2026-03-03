import React, { useEffect, useMemo, useRef } from "react";

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function pseudo(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default function TankGaugeCanvas({ fill01 }) {
  const canvasRef = useRef(null);
  const simTRef = useRef(0);
  const fill = useMemo(() => clamp(fill01, 0, 1), [fill01]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      simTRef.current += 1;
      const t = simTRef.current;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const pad = 18;
      const x0 = pad;
      const y0 = pad;
      const x1 = w - pad;
      const y1 = h - pad;
      const iw = x1 - x0;
      const ih = y1 - y0;

      ctx.save();
      ctx.beginPath();
      roundRect(ctx, x0, y0, iw, ih, 18);
      ctx.clip();

      const bg = ctx.createLinearGradient(0, y0, 0, y1);
      bg.addColorStop(0, "rgba(0,0,0,.38)");
      bg.addColorStop(1, "rgba(0,0,0,.18)");
      ctx.fillStyle = bg;
      ctx.fillRect(x0, y0, iw, ih);

      const fH = ih * fill;
      const topY = y1 - fH;

      const lox = ctx.createLinearGradient(0, topY, 0, y1);
      lox.addColorStop(0, "rgba(127,231,255,.10)");
      lox.addColorStop(0.28, "rgba(47,185,255,.44)");
      lox.addColorStop(1, "rgba(27,108,255,.34)");
      ctx.fillStyle = lox;
      ctx.fillRect(x0, topY, iw, fH);

      const waveAmp = 6 + 10 * fill;
      const waveLen = 70;
      const phase = t * 0.035;
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "rgba(127,231,255,.58)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= iw; x += 1) {
        const y =
          topY +
          Math.sin(x / waveLen + phase) * waveAmp * 0.35 +
          Math.sin(x / (waveLen * 0.55) - phase * 1.4) * waveAmp * 0.18;
        const px = x0 + x;
        const py = clamp(y, y0, y1);
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";

      const band = ctx.createLinearGradient(0, topY - 18, 0, topY + 40);
      band.addColorStop(0, "rgba(127,231,255,0)");
      band.addColorStop(0.5, `rgba(127,231,255,${0.10 + fill * 0.12})`);
      band.addColorStop(1, "rgba(127,231,255,0)");
      ctx.fillStyle = band;
      ctx.fillRect(x0, topY - 22, iw, 64);

      ctx.fillStyle = "rgba(233,237,243,.06)";
      const bubbles = Math.floor(6 + fill * 10);
      for (let i = 0; i < bubbles; i += 1) {
        const bx = x0 + iw * (0.10 + 0.80 * pseudo(i * 997 + t * 0.2));
        const by = topY + fH * pseudo(i * 331 + t * 0.15);
        const br = 1 + 2.2 * pseudo(i * 77);
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [fill]);

  return <canvas ref={canvasRef} />;
}
