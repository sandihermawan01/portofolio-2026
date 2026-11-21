"use client";

import * as React from "react";
import Link from "next/link";
import type { Project } from "@/types/content";
import { formatDateTime } from "@/lib/utils";

export function NowPinnedList({
  projects,
  openIndex,
  onHoverChange,
}: {
  projects: Project[];
  openIndex: number;
  onHoverChange: (index: number | null) => void;
}) {
  const lastIndex = projects.length - 1;
  const isLastOpen = openIndex === lastIndex;

  const listRef = React.useRef<HTMLOListElement>(null);
  const [reservedHeight, setReservedHeight] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      setReservedHeight(el.scrollHeight);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [projects.length]);

  return (
    // The outer `relative` div has no `overflow-hidden` of its own — it
    // exists only so the external last-row bar below can be positioned
    // against something that spans both the clipped list and that bar.
    <div className="relative">
      <div
        className="relative overflow-hidden"
        style={reservedHeight !== null ? { height: `${reservedHeight}px` } : undefined}
      >
        <ol ref={listRef} className="absolute inset-x-0 top-0 divide-y divide-border border border-border">
          {projects.map((project, index) => {
            const isOpen = index === openIndex;
            const isLast = index === lastIndex;
            const barClassName = isLast
              ? ""
              : isOpen
                ? " before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:w-full before:bg-foreground before:opacity-100 before:transition-[width,opacity] before:duration-500 before:ease-out"
                : " before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:w-0 before:bg-foreground before:opacity-0 before:transition-[width,opacity] before:duration-500 before:ease-out";
            return (
              <li key={project.id}>
                <Link
                  href={`/project/${project.slug}`}
                  onMouseEnter={() => onHoverChange(index)}
                  onMouseLeave={() => onHoverChange(null)}
                  className={
                    (isOpen
                      ? "relative flex h-[129.5px] flex-col overflow-hidden bg-accent px-4 py-6 transition-all duration-500 ease-out sm:h-[105.5px]"
                      : "relative flex h-[75.5px] flex-col overflow-hidden px-4 py-3 transition-all duration-500 ease-out sm:h-[51.5px]") + barClassName
                  }
                >
                <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="index-label shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px]">
                      Project
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{project.title}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formatDateTime(project.updatedAt)}
                  </span>
                </span>
                {project.summary && (
                  <span
                    className={
                      isOpen
                        ? "line-clamp-2 mt-2 min-w-0 max-h-16 text-xs text-muted-foreground opacity-100 transition-all duration-500 ease-out"
                        : "line-clamp-2 min-w-0 max-h-0 text-xs text-muted-foreground opacity-0 transition-all duration-500 ease-out"
                    }
                  >
                    {project.summary}
                  </span>
                )}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      {reservedHeight !== null && (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 h-[2px] bg-foreground transition-[width,opacity] duration-500 ease-out ${
            isLastOpen ? "w-full opacity-100" : "w-0 opacity-0"
          }`}
          style={{ top: `${reservedHeight - 2}px` }}
        />
      )}
    </div>
  );
}
