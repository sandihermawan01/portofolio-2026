"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  label: string | null;
}

/**
 * Canvas-based force-directed node graph, in the spirit of Obsidian's
 * "Graph View" — nodes drift slowly, lines connect nodes that are close
 * to each other (opacity scales with proximity), and the graph gently
 * reacts to the cursor (nearby nodes are nudged away, like Obsidian's
 * hover repulsion). Built from scratch on `<canvas>`, no graph/physics
 * library — this is simple enough (a few dozen nodes, pairwise distance
 * checks) that a library would be overkill for one decorative hero.
 *
 * A handful of nodes are labeled with the owner's actual skills (real
 * profile data, not placeholder tags) — like Obsidian's note titles —
 * the rest are small unlabeled filler nodes that just add graph density.
 *
 * Runs via `requestAnimationFrame`, paused entirely (one static frame,
 * no loop, no mousemove listener) for `prefers-reduced-motion: reduce`.
 */
function GraphCanvas({ skills }: { skills: string[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const nodesRef = React.useRef<GraphNode[]>([]);
  const mouseRef = React.useRef<{ x: number; y: number } | null>(null);
  const sizeRef = React.useRef({ width: 0, height: 0 });

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const foreground = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
    const nodeColor = foreground ? `hsl(${foreground})` : "#888";

    const labels = skills.slice(0, 7);
    const MAX_EDGE_DIST = 150;
    const MOUSE_RADIUS = 130;

    /**
     * Node count scales with the hero's actual on-screen area instead of
     * being a fixed number — a fixed count looked fine on a narrow mobile
     * hero but read as sparse/empty on a wide desktop one (more so now
     * that the page's max width grew). One node per ~9,000px² keeps
     * mobile close to how it looked before while desktop gets noticeably
     * busier, clamped so it never goes too sparse or too crowded.
     */
    function computeFillerCount(): number {
      const { width, height } = sizeRef.current;
      const density = (width * height) / 9000;
      return Math.max(18, Math.min(70, Math.round(density)));
    }

    function resize() {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    function makeNode(label: string | null): GraphNode {
      const { width, height } = sizeRef.current;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.1;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: label ? 3.5 : 1.8,
        label,
      };
    }

    function initNodes() {
      const fillerCount = computeFillerCount();
      nodesRef.current = [...labels.map((l) => makeNode(l)), ...Array.from({ length: fillerCount }, () => makeNode(null))];
    }

    resize();
    initNodes();

    function step() {
      if (!ctx) return;
      const { width, height } = sizeRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      // Update positions.
      for (const n of nodes) {
        if (!prefersReducedMotion) {
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
          n.x = Math.max(0, Math.min(width, n.x));
          n.y = Math.max(0, Math.min(height, n.y));

          if (mouse) {
            const dx = n.x - mouse.x;
            const dy = n.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < MOUSE_RADIUS && dist > 0.01) {
              const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 0.4;
              n.x += (dx / dist) * force;
              n.y += (dy / dist) * force;
            }
          }
        }
      }

      // Edges.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < MAX_EDGE_DIST) {
            const alpha = (1 - dist / MAX_EDGE_DIST) * 0.22;
            ctx.strokeStyle = nodeColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes + labels.
      ctx.globalAlpha = 1;
      for (const n of nodes) {
        const nearMouse = mouse ? Math.hypot(n.x - mouse.x, n.y - mouse.y) < MOUSE_RADIUS : false;
        ctx.beginPath();
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = n.label ? 0.6 : 0.35;
        ctx.arc(n.x, n.y, nearMouse ? n.r * 1.6 : n.r, 0, Math.PI * 2);
        ctx.fill();

        if (n.label) {
          ctx.globalAlpha = nearMouse ? 0.9 : 0.5;
          // A plain monospace stack, not `var(--font-mono)` — canvas's
          // `font` setter does not resolve CSS custom properties.
          ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
          ctx.fillText(n.label, n.x + n.r + 6, n.y + 3);
        }
      }
      ctx.globalAlpha = 1;
    }

    let frame: number;
    function loop() {
      step();
      frame = requestAnimationFrame(loop);
    }

    if (prefersReducedMotion) {
      step(); // single static frame, no loop, no mouse tracking
    } else {
      frame = requestAnimationFrame(loop);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMouseLeave() {
      mouseRef.current = null;
    }
    function onResize() {
      resize();
    }

    if (!prefersReducedMotion) {
      container.addEventListener("mousemove", onMouseMove);
      container.addEventListener("mouseleave", onMouseLeave);
    }
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [skills]);

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

/**
 * The large headline that fills the hero's main text slot. This is original
 * copy — not pulled from `Profile` — describing the kind of work a web
 * developer does. It's decorative motif for this one hero, not a factual
 * claim about the owner, so it stays a hardcoded string here rather than a
 * new admin-editable field (unlike `name`/`role`/`skills`, which are real
 * profile data).
 */
const TAGLINE = "I build fast, reliable websites — from idea to deployment.";

/**
 * Full-width developer-themed hero for the Home page — the Obsidian-style
 * graph sits behind a compact "Name / Role" line and a large typewriter
 * tagline.
 *
 * `name`/`role`/`skills` are real profile data; the graph's filler nodes
 * and the tagline copy are decorative motif, not content — see the
 * project's "no dummy data" rule.
 */
export function DeveloperHero({ name, role, skills = [] }: { name: string; role: string; skills?: string[] }) {
  const [typedTagline, setTypedTagline] = React.useState("");
  const [doneTyping, setDoneTyping] = React.useState(false);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setTypedTagline(TAGLINE);
      setDoneTyping(true);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedTagline(TAGLINE.slice(0, i));
      if (i >= TAGLINE.length) {
        clearInterval(interval);
        setDoneTyping(true);
      }
    }, 28);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mb-16 h-[62vh] min-h-[420px] max-h-[640px] overflow-hidden border-b border-border">
      <GraphCanvas skills={skills} />

      <div className="container-editorial pointer-events-none relative flex h-full flex-col justify-center">
        <p className="index-label motion-safe:animate-fade-in mb-4">INDEX — 00 / HOME</p>

        <p className="motion-safe:animate-fade-in font-mono text-base text-muted-foreground sm:text-lg">
          {name || "Nama belum diisi"} <span className="text-foreground">/</span> {role || "Role belum diisi"}
        </p>

        <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {typedTagline}
          {!doneTyping && <span className="motion-safe:animate-blink">_</span>}
        </h1>

        <div
          className={`pointer-events-auto mt-8 flex flex-wrap gap-3 transition-opacity duration-500 ${
            doneTyping ? "motion-safe:animate-fade-in-up opacity-100" : "opacity-0 motion-reduce:opacity-100"
          }`}
        >
          <Button asChild>
            <Link href="/project">Lihat Project</Link>
          </Button>
          {/* Not `variant="outline"` — that variant's own `hover:bg-accent`
              would fight with `.brutalist-hover`'s background over who
              wins on hover. Built from the default variant instead, with
              its primary-color classes overridden back to an outline
              look (tailwind-merge resolves same-property overrides when
              passed via `className`, so this is the only background/
              border rule active on hover, matching ThemeToggle exactly). */}
          <Button asChild className="brutalist-hover border-border bg-background text-foreground hover:opacity-100">
            <Link href="/contact">Hubungi Saya</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
