"use client";

import * as React from "react";
interface SkillBar {
  name: string;
  percentage: number;
}

// Top to bottom — purely a decorative scale, not tied 1:1 to any item.
// Kept distinct from the Tech Stack section's level wording on purpose.
const LEVELS = ["Mastered", "Skilled", "Learning", "Curious"];

const SHADES = [1, 0.82, 0.66, 0.5, 0.36, 0.24];

const CHART_HEIGHT = "h-48 sm:h-56";

export function SkillBarsChart({ skills }: { skills: SkillBar[] }) {
  const items = skills.slice(0, 6);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="flex gap-3 sm:gap-6">
      {/* Level scale — fixed width, stays put while the chart area scrolls on mobile. */}
      <div
        className={`flex ${CHART_HEIGHT} w-9 shrink-0 flex-col justify-between py-0 text-right font-mono text-[9px] uppercase leading-tight tracking-wide text-muted-foreground sm:w-16 sm:text-[10px]`}
      >
        {LEVELS.map((lvl) => (
          <span key={lvl}>{lvl}</span>
        ))}
      </div>

      {/* Chart area: horizontally scrollable on narrow screens so bars never get squished. */}
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1">
        <div className="relative sm:!min-w-full" style={{ minWidth: `${items.length * 68}px` }}>
          <div className={`pointer-events-none absolute inset-0 flex ${CHART_HEIGHT} flex-col justify-between`}>
            {LEVELS.map((lvl) => (
              <div key={lvl} className="border-t border-dashed border-border/60" />
            ))}
          </div>

          <div className={`relative flex ${CHART_HEIGHT} items-end gap-2 sm:gap-4`}>
            {items.map((skill, i) => (
              <div key={skill.name} className="group flex h-full w-14 shrink-0 flex-col justify-end sm:w-auto sm:flex-1 sm:shrink">
                <div
                  className="flex flex-col items-center justify-start rounded-t-sm border border-border px-1 pt-2 text-background transition-[height,transform] duration-700 ease-out group-hover:-translate-y-1 sm:px-2 sm:pt-3"
                  style={{
                    height: visible ? `${Math.max(skill.percentage, 8)}%` : "0%",
                    backgroundColor: `hsl(var(--foreground) / ${SHADES[i % SHADES.length]})`,
                    transitionDelay: `${i * 90}ms`,
                  }}
                >
                  <span
                    className="font-display text-base font-semibold leading-none opacity-0 transition-opacity duration-300 sm:text-xl"
                    style={{
                      opacity: visible ? 1 : 0,
                      transitionDelay: `${i * 90 + 500}ms`,
                    }}
                  >
                    {skill.percentage}
                    <span className="align-top text-[9px] sm:text-xs">%</span>
                  </span>
                </div>
                <p
                  className="mt-2 line-clamp-2 break-words text-center text-[10px] leading-tight text-muted-foreground opacity-0 transition-opacity duration-500 sm:text-xs"
                  style={{ opacity: visible ? 1 : 0, transitionDelay: `${i * 90 + 300}ms` }}
                >
                  {skill.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
