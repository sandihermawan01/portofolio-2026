import type { SkillWithShare } from "@/lib/skills";
import { SKILL_LEVELS, SKILL_LEVEL_LABEL, SKILL_LEVEL_SHADE } from "@/lib/skills";

// A real pie chart, grayscale (no hues — the site is monochrome). Past a
// handful of entries the tail folds into "Other" so slices stay readable.
// Slice brightness maps directly to the skill's level (see SKILL_LEVEL_SHADE),
// so the same level always reads as the same brightness — the scale legend
// below the chart spells that mapping out.
const MAX_SLICES = 6;
const OTHER_SHADE = 0.15;
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

/** Low-to-high legend spelling out what each slice shade means. */
function LevelScale() {
  return (
    <div className="mt-6 sm:mt-5">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">Skala warna level</p>
      <div className="flex items-stretch gap-1.5">
        {SKILL_LEVELS.map((level) => (
          <div key={level} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-3 w-full rounded-sm border border-border"
              style={{ backgroundColor: `hsl(var(--foreground) / ${SKILL_LEVEL_SHADE[level]})` }}
            />
            <span className="text-center text-[9px] leading-tight text-muted-foreground">{SKILL_LEVEL_LABEL[level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const slices = items.map((item) => {
    const startAngle = angle;
    const sweep = (item.percentage / 100) * 360;
    angle += sweep;
    const endAngle = angle;
    const mid = (startAngle + endAngle) / 2;
    const labelPos = polarToCartesian(mid, RADIUS * 0.62);
    const shade = "level" in item ? SKILL_LEVEL_SHADE[item.level] : OTHER_SHADE;
    return { ...item, startAngle, endAngle, labelPos, shade };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-56 w-56 shrink-0 overflow-visible">
        {slices.map((slice) => (
          <g
            key={slice.name}
            className="cursor-default transition-transform duration-300 ease-out hover:scale-110"
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          >
            <path
              d={slicePath(slice.startAngle, slice.endAngle)}
              fill={`hsl(var(--foreground) / ${slice.shade})`}
              stroke="hsl(var(--background))"
              strokeWidth={3}
            />
            {slice.percentage >= INLINE_LABEL_MIN_PERCENT && (
              <text
                x={slice.labelPos.x}
                y={slice.labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono text-[9px]"
                fill="white"
                stroke="black"
                strokeWidth={1}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {slice.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="flex-1">
        <ul className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
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

        <LevelScale />
      </div>
    </div>
  );
}
