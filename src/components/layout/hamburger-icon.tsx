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
    <span className="relative flex h-4 w-4 flex-col items-center justify-center" aria-hidden="true">
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
