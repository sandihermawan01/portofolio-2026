export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border p-6">
      <p className="index-label">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold">{value}</p>
    </div>
  );
}
