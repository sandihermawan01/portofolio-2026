"use client";

import * as React from "react";
import Link from "next/link";
import type { Project } from "@/types/content";
import { NowPinnedList } from "@/components/portfolio/now-pinned-list";
import { NowGalleryCarousel } from "@/components/portfolio/now-gallery-carousel";

export function NowPanel({ projects, children }: { projects: Project[]; children?: React.ReactNode }) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const openIndex = hoveredIndex ?? 0;

  if (projects.length === 0) return null;
  // The guard above rules out `undefined` here at runtime; the `!` is
  // just telling the type checker what that guard already guarantees.
  const openProject = projects[openIndex] ?? projects[0]!;

  return (
    <div className="grid grid-cols-1 border-t border-border md:grid-cols-2">
      <div className="flex flex-col justify-between md:border-r md:border-border">
        <NowPinnedList projects={projects} openIndex={openIndex} onHoverChange={setHoveredIndex} />
        {children}
      </div>

      <Link
        href={`/project/${openProject.slug}`}
        className="relative block transition-[filter] duration-200 hover:brightness-95"
      >
        {projects.map((project, i) => {
          const projectImages =
            project.gallery.length > 0
              ? project.gallery
              : project.coverImageUrl
                ? [project.coverImageUrl]
                : [];
          return (
            <NowGalleryCarousel
              key={project.id}
              images={projectImages}
              alt={project.title}
              active={i === openIndex}
            />
          );
        })}
      </Link>
    </div>
  );
}
