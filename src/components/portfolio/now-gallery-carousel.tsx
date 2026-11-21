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
 *
 * `NowPanel` now keeps one of these mounted *per pinned project* all the
 * time — stacked on top of each other, with only the currently-open one
 * visible (see the comment there) — rather than swapping a single
 * instance's `images` prop in and out as the hover target changes. That
 * used to mean every project's screenshots only started loading the
 * first time its row was hovered, so switching to a project whose image
 * hadn't been requested yet showed a brief blank/loading flash before it
 * popped in — the "nyendat-nyendat" stutter. With every project's
 * carousel mounted from the start, every image begins loading on initial
 * page load instead, so by the time the cursor actually reaches a row
 * its screenshot is already sitting in the browser cache.
 *
 * `active` switches this root box between taking up normal document flow
 * (the one currently-open project) and sitting absolutely positioned,
 * invisible and unclickable, exactly on top of it (every other project,
 * still loading in the background). This has to live on this
 * component's *own* root div rather than on an extra wrapping `<div>`
 * around it in `NowPanel` — that was tried first, and it broke the
 * carousel entirely: `md:h-full` here only means anything relative to a
 * parent with a *definite* height, which is this component's direct
 * parent (the `Link` in `NowPanel`, stretched by CSS Grid). An extra
 * wrapping div in between has no height of its own (plain `position:
 * relative`/`absolute` don't imply one), so `height: 100%` against it
 * resolves to nothing per the CSS spec, and the carousel collapsed to
 * zero height on desktop — exactly the "carousel disappeared"
 * regression. Putting `active`'s positioning classes directly on this
 * root div keeps it the *immediate* child of that stretched `Link`, so
 * `md:h-full` still has something real to measure against.
 */
export function NowGalleryCarousel({
  images,
  alt,
  active,
}: {
  images: string[];
  alt: string;
  active: boolean;
}) {
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

  // Previously `return null` here when there were no images at all (no
  // gallery, no cover) — which left this entire grid column with nothing
  // in it. An empty grid cell has no intrinsic size, so it collapsed:
  // the card ended up looking like just the left text column with a
  // random gap where the carousel should be, and that empty gap plainly
  // can't be clicked even though it's still technically inside the
  // outer <Link>. Rendering a same-sized placeholder box instead keeps
  // the two-column card looking and behaving like one solid block
  // regardless of whether the project has screenshots yet.
  // Below `md`, this box sits in its own grid row (stacked under the
  // list, not sharing a row with it), so `h-full` has nothing to stretch
  // against and previously fell back to a somewhat arbitrary 320px —
  // tall enough to crop real screenshots awkwardly (cutting off text
  // partway through). `aspect-video` keeps it at a sane, predictable
  // 16:9 instead on mobile; `md:h-full` is what actually matters once
  // the two-column layout kicks in and this needs to match the list's
  // height. Same story for the border: a left rule only makes sense
  // once this sits beside the list, not above/below it.
  // `active`'s own classes come first so they can be overridden by the
  // shared sizing/border classes below where they don't conflict (e.g.
  // both set `relative`/`position`, and the shared string wins since it
  // comes later in the string — intentional, `active` only needs to
  // contribute the *non*-active case's `absolute inset-0 opacity-0
  // pointer-events-none`, which nothing else here sets).
  const positionClassName = active ? "relative" : "absolute inset-0 opacity-0 pointer-events-none";

  if (images.length === 0) {
    return (
      <div
        className={`flex aspect-video w-full items-center justify-center border-t border-border bg-muted md:aspect-auto md:h-full md:border-l md:border-t-0 ${positionClassName}`}
        aria-hidden="true"
      >
        <p className="index-label text-muted-foreground">Belum ada screenshot</p>
      </div>
    );
  }

  return (
    <div
      className={`aspect-video w-full overflow-hidden border-t border-border bg-muted md:aspect-auto md:h-full md:border-l md:border-t-0 ${positionClassName}`}
      aria-hidden="true"
    >
      {/* `object-contain`, not `object-cover` — these are real project
          screenshots (often wide desktop UI), and a fixed 16:9/h-full box
          rarely matches that aspect ratio. `cover` was center-cropping
          chunks of the actual screenshot content off both edges just to
          fill the box; `contain` always shows the whole image, letterboxed
          on `bg-muted` instead of cutting anything off. */}
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain transition-opacity ease-in-out"
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
