import { cn } from "@/lib/utils";
import type { ContributionCalendar } from "@/types/github";

/**
 * Pure presentational contribution heatmap — a grid of week columns, each a
 * column of day cells shaded by `level` (0–4, computed server-side in
 * lib/github/client.ts). Renders as plain `<div>`s, not an `<img>` or
 * canvas, so it needs no extra `img-src` CSP allowance and stays crisp at
 * any zoom level.
 *
 * Each cell has an accessible label (`aria-label`, via `title` + a visually
 * hidden span) stating the date and count, since color alone cannot convey
 * the value to a screen reader or a color-blind visitor.
 */
export function ContributionHeatmap({ calendar }: { calendar: ContributionCalendar }) {
  return (
    <div>
      <div
        role="img"
        aria-label={`Grafik kontribusi GitHub, total ${calendar.totalContributions} kontribusi dalam 12 bulan terakhir`}
        className="flex gap-[3px] overflow-x-auto pb-2"
      >
        {calendar.weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.days.map((day, di) => (
              <div
                key={day.date}
                title={`${day.count} kontribusi pada ${formatDate(day.date)}`}
                style={{ animationDelay: `${(wi * 7 + di) * 2}ms` }}
                className={cn(
                  "h-[11px] w-[11px] rounded-[2px] border border-border/50",
                  "motion-safe:animate-scale-in motion-safe:opacity-0",
                  "transition-transform duration-150 ease-out hover:scale-150 hover:border-foreground",
                  levelClass(day.level)
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sedikit</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={cn("h-[11px] w-[11px] rounded-[2px] border border-border/50", levelClass(level))} />
        ))}
        <span>Banyak</span>
      </div>
    </div>
  );
}

/** Monochrome-retro shading: level 0 is the paper/background tone, higher
 * levels step through grays to near-black — no green, to stay consistent
 * with the rest of the site's palette (see globals.css design tokens). */
function levelClass(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 0:
      return "bg-background";
    case 1:
      return "bg-muted-foreground/20";
    case 2:
      return "bg-muted-foreground/45";
    case 3:
      return "bg-muted-foreground/70";
    case 4:
      return "bg-foreground";
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
