import type { SkillWithShare } from "@/lib/skills";

// A single tall segmented bar instead of a pie/donut: it reads as a true
// part-to-whole split at a glance, scales past a handful of tech entries
// (the tail folds into "Other"), and only needs one flat monochrome fill —
// no categorical hues, which a pie chart with many slices would need.
const MAX_SLICES = 6;
const SHADES = [1, 0.8, 0.62, 0.48, 0.34, 0.2];
const LABEL_MIN_PERCENT = 10;

export function TechStackBar({ skills }: { skills: SkillWithShare[] }) {
  if (skills.length === 0) return null;

  const sorted = [...skills].sort((a, b) => b.percentage - a.percentage);
  const visible = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const items = rest.length > 0
    ? [...visible, { name: "Other", percentage: rest.reduce((sum, s) => sum + s.percentage, 0) }]
    : visible;

  return (
    <div>
      <div className="flex h-7 gap-[2px] overflow-hidden rounded-sm bg-border">
        {items.map((item, i) => (
          <div
            key={item.name}
            className="relative flex items-center overflow-hidden"
            style={{ width: `${item.percentage}%`, backgroundColor: `hsl(var(--foreground) / ${SHADES[i] ?? 0.15})` }}
            title={`${item.name} — ${item.percentage}%`}
          >
            {item.percentage >= LABEL_MIN_PERCENT && (
              <span
                className="truncate px-2 font-mono text-[11px]"
                style={{ color: "white", mixBlendMode: "difference" }}
              >
                {item.percentage}%
              </span>
            )}
          </div>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 border border-border"
              style={{ backgroundColor: `hsl(var(--foreground) / ${SHADES[i] ?? 0.15})` }}
            />
            {item.name} <span className="font-mono">{item.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
