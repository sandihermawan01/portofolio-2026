export function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">{value}</p>
      <p className="index-label mt-1">{label}</p>
    </div>
  );
}
