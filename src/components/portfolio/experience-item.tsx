"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { formatMonthYear } from "@/lib/utils";
import type { Experience } from "@/types/content";

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  volunteer: "Volunteer",
};

/**
 * One collapsible entry on the /experience list — collapsed by default to
 * just the index, date range, title and company (a minimal row), expanding
 * on click/Enter to reveal employment type, location, the full description
 * and skill badges.
 *
 * Built with a real `<button>` (not a bare `<div onClick>`) so it's
 * keyboard-reachable and has `aria-expanded`, plus a native `<details>`
 * fallback isn't used here because we want the CSS grid-rows height
 * transition below — `<details>` can't animate open/close on its own
 * without extra JS. No new dependency: the "slide" is a pure CSS trick
 * (animating `grid-template-rows` from `0fr` to `1fr`, with the content
 * wrapped in `overflow-hidden`) that needs no measured pixel heights.
 */
export function ExperienceItem({ experience, index }: { experience: Experience; index: number }) {
  const [open, setOpen] = React.useState(false);
  const panelId = `experience-panel-${experience.id}`;

  const typeAndLocation = [EMPLOYMENT_TYPE_LABEL[experience.employmentType] ?? experience.employmentType, experience.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rule first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative grid w-full gap-2 px-4 py-8 pr-12 text-left transition-colors hover:bg-accent/50 sm:grid-cols-[120px_1fr] sm:gap-8 sm:px-6 sm:pr-14"
      >
        <div>
          <p className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMonthYear(experience.startDate)} —{" "}
            {experience.isCurrent ? "Sekarang" : experience.endDate ? formatMonthYear(experience.endDate) : ""}
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-xl font-medium">{experience.title}</h2>
            <span className="text-muted-foreground">· {experience.company}</span>
            {experience.isCurrent && <Badge variant="solid">Current</Badge>}
          </div>
          {typeAndLocation && <p className="mt-1 text-sm text-muted-foreground">{typeAndLocation}</p>}
          {!open && experience.description && (
            <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{experience.description}</p>
          )}
          {!open && experience.skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {experience.skills.slice(0, 5).map((skill) => (
                <li key={skill}>
                  <Badge variant="outline">{skill}</Badge>
                </li>
              ))}
              {experience.skills.length > 5 && (
                <li className="self-center text-xs text-muted-foreground">+{experience.skills.length - 5}</li>
              )}
            </ul>
          )}
        </div>

        {/* Positioned absolutely (pinned to the button, not part of the grid
            flow) so it stays put in the same corner regardless of how much
            the content above/beside it grows or shrinks when open/closed —
            previously it was a 3rd grid row/column, which made it visibly
            jump upward on mobile once the collapsed-state preview text and
            skill badges disappeared on open. */}
        <span
          aria-hidden="true"
          className={`absolute right-4 top-8 shrink-0 font-mono text-lg text-muted-foreground transition-transform duration-200 motion-reduce:transition-none sm:right-6 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-8 sm:grid sm:grid-cols-[120px_1fr] sm:gap-8 sm:px-6">
            <div aria-hidden="true" />
            <div>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">{experience.description}</p>
              {experience.skills.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {experience.skills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="outline">{skill}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
