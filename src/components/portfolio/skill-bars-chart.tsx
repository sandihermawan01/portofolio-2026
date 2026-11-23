interface SkillBar {
  name: string;
  percentage: number;
}

// Top to bottom — purely a decorative scale, not tied 1:1 to any item.
const LEVELS = ["Jedi", "Ninja", "Geek", "Newbie"];

const SHADES = [1, 0.82, 0.66, 0.5, 0.36, 0.24];

export function SkillBarsChart({ skills }: { skills: SkillBar[] }) {
  const items = skills.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="flex gap-4 sm:gap-6">
      <div className="flex h-56 w-14 shrink-0 flex-col justify-between py-0 text-right font-mono text-[10px] uppercase tracking-wide text-muted-foreground sm:w-16">
        {LEVELS.map((lvl) => (
          <span key={lvl}>{lvl}</span>
        ))}
      </div>

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 flex h-56 flex-col justify-between">
          {LEVELS.map((lvl) => (
            <div key={lvl} className="border-t border-dashed border-border/60" />
          ))}
        </div>

        <div className="relative flex h-56 items-end gap-3 sm:gap-4">
          {items.map((skill, i) => (
            <div key={skill.name} className="flex h-full flex-1 flex-col justify-end">
              <div
                className="flex flex-col items-center justify-start rounded-t-sm border border-border px-1 pt-3 text-background sm:px-2"
                style={{
                  height: `${Math.max(skill.percentage, 8)}%`,
                  backgroundColor: `hsl(var(--foreground) / ${SHADES[i % SHADES.length]})`,
                }}
              >
                <span className="font-display text-lg font-semibold leading-none sm:text-xl">
                  {skill.percentage}
                  <span className="align-top text-[10px] sm:text-xs">%</span>
                </span>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground sm:text-xs">{skill.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
