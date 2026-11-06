export function SectionHeading({ index, title, lead }: { index: string; title: string; lead?: string }) {
  return (
    <div className="mb-10">
      <p className="index-label mb-2">{index}</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {lead && <p className="mt-4 max-w-2xl text-muted-foreground">{lead}</p>}
    </div>
  );
}
