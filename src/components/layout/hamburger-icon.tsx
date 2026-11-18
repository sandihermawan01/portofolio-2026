/**
 * The mobile nav trigger used to just swap a static lucide `<Menu />` icon
 * for nothing in particular when the Sheet opened — the panel had its own
 * separate `<X />` close button, but the hamburger itself never visually
 * acknowledged the open state. This is the classic 3-bar hamburger that
 * morphs into an X instead: the top/bottom bars rotate and slide to meet
 * in the middle, the middle bar fades out, all via `transform`/`opacity`
 * transitions (not a start/end class swap), so it reads as one continuous
 * shape-shift rather than a cut.
 */
export function HamburgerIcon({ open }: { open: boolean }) {
  return (
    // `pointer-events-none` — `Button`'s own styles give every `<svg>`
    // child this same treatment (`[&_svg]:pointer-events-none`) so a
    // click anywhere on an icon always resolves to the button itself,
    // never one of the icon's internal shapes. This is a `<span>`-based
    // icon, not an `<svg>`, so it falls outside that rule and needs it
    // explicitly — without it, a click landing exactly on one of the
    // bars below targets *that bar*, not the button, which is enough to
    // confuse Radix's trigger-vs-outside-click detection on the Sheet
    // this opens and made it flicker open then immediately closed.
    <span
      className="pointer-events-none relative flex h-4 w-4 flex-col items-center justify-center"
      aria-hidden="true"
    >
      <span
        className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-y-0 rotate-45" : "-translate-y-[5px] rotate-0"
        }`}
      />
      <span
        className={`absolute h-[1.5px] w-4 bg-current transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-y-0 -rotate-45" : "translate-y-[5px] rotate-0"
        }`}
      />
    </span>
  );
}
