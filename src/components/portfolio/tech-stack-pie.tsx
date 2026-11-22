import type { SkillWithShare } from "@/lib/skills";
import { SKILL_LEVEL_LABEL } from "@/lib/skills";

// A real pie chart, grayscale (no hues — the site is monochrome). Past a
// handful of entries the tail folds into "Other" so slices stay readable.
const MAX_SLICES = 6;
const SHADES = [1, 0.8, 0.62, 0.48, 0.34, 0.2];
const INLINE_LABEL_MIN_PERCENT = 10;
const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 100;

function polarToCartesian(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function slicePath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(endAngle, RADIUS);
  const end = polarToCartesian(startAngle, RADIUS);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function TechStackPie({ skills }: { skills: SkillWithShare[] }) {
  if (skills.length === 0) return null;

  const sorted = [...skills].sort((a, b) => b.percentage - a.percentage);
  const visible = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const items = rest.length > 0
    ? [...visible, { name: "Other", percentage: rest.reduce((sum, s) => sum + s.percentage, 0) }]
    : visible;

  let angle = 0;
  const slices = items.map((item, i) => {
    const startAngle = angle;
    const sweep = (item.percentage / 100) * 360;
    angle += sweep;
    const endAngle = angle;
    const mid = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(mid, RADIUS * 0.62);
    return { ...item, startAngle, endAngle, labelPos, shade: SHADES[i] ?? 0.15 };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-56 w-56 shrink-0">
        {slices.map((slice) => (
          <path
            key={slice.name}
            d={slicePath(slice.startAngle, slice.endAngle)}
            fill={`hsl(var(--foreground) / ${slice.shade})`}
            stroke="hsl(var(--background))"
            strokeWidth={3}
          />
        ))}
        {slices.map(
          (slice) =>
            slice.percentage >= INLINE_LABEL_MIN_PERCENT && (
              <text
                key={`${slice.name}-label`}
                x={slice.labelPos.x}
                y={slice.labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono text-[9px]"
                fill="white"
                stroke="black"
                strokeWidth={2.5}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {slice.name}
              </text>
            )
        )}
      </svg>

      <ul className="grid flex-1 grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 border border-border"
              style={{ backgroundColor: `hsl(var(--foreground) / ${slice.shade})` }}
            />
            <span className="truncate">{slice.name}</span>
            {"level" in slice && <span className="font-mono underline underline-offset-2">{SKILL_LEVEL_LABEL[slice.level]}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
