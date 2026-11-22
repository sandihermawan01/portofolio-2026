"use client";

import * as React from "react";

// The image sits pixelated by default; moving the cursor over it "scans"
// and reveals the sharp image in a blocky patch that follows the pointer.
const BLOCK = 26; // size of the reveal patch's edge cells (shape only)
const SAMPLE = 10; // how coarse the resting pixelated base is
const RADIUS = 140;
const EASE = 0.18;

export function PixelCursorImage({ src, alt = "" }: { src: string; alt?: string }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = src;

    const base = document.createElement("canvas"); // the resting pixelated layer
    const baseCtx = base.getContext("2d");

    const mask = document.createElement("canvas"); // reveal-patch silhouette
    const ring = document.createElement("canvas"); // just its outer edge
    const maskCtx = mask.getContext("2d");
    const ringCtx = ring.getContext("2d");
    const RING_OFFSETS: [number, number][] = [
      [-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2], [-2, 2], [2, -2],
    ];

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const target = { x: -9999, y: -9999, active: false };
    const render = { x: -9999, y: -9999 };

    function cover(c: CanvasRenderingContext2D, cw: number, ch: number) {
      if (!img.naturalWidth) return;
      const ir = img.naturalWidth / img.naturalHeight;
      const br = cw / ch;
      let dw = cw;
      let dh = ch;
      let ox = 0;
      let oy = 0;
      if (ir > br) {
        dh = ch;
        dw = ch * ir;
        ox = (cw - dw) / 2;
      } else {
        dw = cw;
        dh = cw / ir;
        oy = (ch - dh) / 2;
      }
      c.drawImage(img, ox, oy, dw, dh);
    }

    function renderBase() {
      if (!baseCtx || !img.naturalWidth) return;
      baseCtx.imageSmoothingEnabled = false;
      baseCtx.clearRect(0, 0, base.width, base.height);
      baseCtx.filter = "grayscale(1) contrast(1.05)";
      cover(baseCtx, base.width, base.height);
      baseCtx.filter = "none";
    }

    function resize() {
      w = wrap!.clientWidth;
      h = wrap!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      base.width = Math.max(1, Math.ceil(w / SAMPLE));
      base.height = Math.max(1, Math.ceil(h / SAMPLE));
      renderBase();

      mask.width = Math.max(1, Math.ceil(w));
      mask.height = Math.max(1, Math.ceil(h));
      ring.width = mask.width;
      ring.height = mask.height;
    }

    function draw() {
      if (w && h && img.complete && img.naturalWidth) {
        render.x += (target.x - render.x) * EASE;
        render.y += (target.y - render.y) * EASE;

        ctx!.clearRect(0, 0, w, h);
        ctx!.imageSmoothingEnabled = false;
        ctx!.drawImage(base, 0, 0, base.width, base.height, 0, 0, w, h);

        if (target.active) {
          // blocky, slightly irregular edge instead of a perfect circle
          const path = new Path2D();
          const cols = Math.ceil(w / BLOCK);
          const rows = Math.ceil(h / BLOCK);
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const cx = col * BLOCK + BLOCK / 2;
              const cy = row * BLOCK + BLOCK / 2;
              const dist = Math.hypot(cx - render.x, cy - render.y);
              // solid core like before, then loose stray pixels scattering
              // further out past the edge instead of a clean cutoff
              const inner = RADIUS * 0.75;
              const outer = RADIUS * 1.6;
              let include = dist < inner;
              if (!include && dist < outer) {
                const hash = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
                const t = (dist - inner) / (outer - inner);
                include = hash < (1 - t) * (1 - t);
              }
              if (include) {
                path.rect(col * BLOCK, row * BLOCK, BLOCK, BLOCK);
              }
            }
          }

          ctx!.save();
          ctx!.clip(path);
          ctx!.imageSmoothingEnabled = true;
          ctx!.filter = "grayscale(1) contrast(1.05)";
          cover(ctx!, w, h);
          ctx!.filter = "none";
          ctx!.restore();

          // outline just the silhouette: dilate the patch, then cut out its interior
          if (maskCtx && ringCtx) {
            maskCtx.clearRect(0, 0, mask.width, mask.height);
            maskCtx.fillStyle = "white";
            maskCtx.fill(path);

            ringCtx.clearRect(0, 0, ring.width, ring.height);
            ringCtx.globalCompositeOperation = "source-over";
            for (const [dx, dy] of RING_OFFSETS) ringCtx.drawImage(mask, dx, dy);
            ringCtx.globalCompositeOperation = "destination-out";
            ringCtx.drawImage(mask, 0, 0);
            ringCtx.globalCompositeOperation = "source-over";

            ctx!.save();
            ctx!.globalCompositeOperation = "difference";
            ctx!.drawImage(ring, 0, 0);
            ctx!.restore();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function toLocal(e: PointerEvent) {
      const rect = wrap!.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      target.active = true;
    }
    function leave() {
      target.active = false;
    }

    img.onload = renderBase;
    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    wrap.addEventListener("pointermove", toLocal);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      wrap.removeEventListener("pointermove", toLocal);
      wrap.removeEventListener("pointerleave", leave);
    };
  }, [src]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      {/* faint scanlines for the retro/CRT feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, white 0px, white 1px, transparent 1px, transparent 3px)",
        }}
      />
      {alt && <span className="sr-only">{alt}</span>}
    </div>
  );
}
