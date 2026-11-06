export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-sm border border-dashed border-border px-6 py-16 text-center">
      <p className="font-display text-lg">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
