"use client";

import * as React from "react";
import Image from "next/image";

const AUTO_ADVANCE_MS = 3200;
const FADE_MS = 500;

/**
 * Auto-looping screenshot carousel for the "Now" page's right-hand side —
 * `project.gallery` (falling back to a single `coverImageUrl` if there's
 * no gallery yet). No carousel library pulled in for this: the whole
 * thing is just one timer cycling an index and a cross-fade between
 * absolutely-positioned `next/image`s, which is all a hands-off, no
 * controls, no-dots-to-click loop needs.
 *
 * Respects `prefers-reduced-motion`: the interval is simply never
 * started, so it quietly holds on the first image instead of looping.
 */
export function NowGalleryCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (images.length <= 1) return;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted" aria-hidden="true">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-opacity ease-in-out"
          style={{ opacity: i === index ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
          priority={i === 0}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full border border-background transition-colors ${
                i === index ? "bg-background" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
