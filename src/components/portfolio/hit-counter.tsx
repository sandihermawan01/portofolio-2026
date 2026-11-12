/**
 * Retro "you are visitor number ######" digit readout — each digit its own
 * bordered box in the site's monospace font, padded with leading zeros,
 * the way old-web hit counters looked. Purely decorative/nostalgic, not an
 * analytics widget — see `features/stats/queries.ts` for what it actually
 * counts (page loads, not unique visitors).
 */
function toDigits(value: number, length: number): string[] {
  return Math.max(0, Math.trunc(value)).toString().padStart(length, "0").split("");
}

export function HitCounter({ count }: { count: number }) {
  const digits = toDigits(count, 6);

  return (
    <div className="flex items-center gap-2">
      <span className="index-label">PENGUNJUNG</span>
      <div className="flex gap-0.5" aria-label={`${count} kunjungan`}>
        {digits.map((digit, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="flex h-6 w-5 items-center justify-center border border-border bg-background font-mono text-xs"
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}
