import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { getNowContent } from "@/features/now/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Now",
  description: "Apa yang sedang dikerjakan sekarang.",
};

export const revalidate = 0;

export default async function NowPage() {
  const now = await getNowContent();

  return (
    <div className="container-editorial py-16">
      <SectionHeading index="02 / NOW" title="Now" lead="Apa yang lagi saya kerjakan dan pikirkan belakangan ini." />

      {!now ? (
        <EmptyState
          title="Belum ada update"
          description="Halaman ini akan menampilkan apa yang sedang dikerjakan setelah diisi dari dashboard admin."
        />
      ) : (
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">{now.headline}</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-muted-foreground sm:text-lg">
            {now.body}
          </p>
          <p className="mt-10 font-mono text-xs text-muted-foreground">
            Terakhir diperbarui: {formatDateTime(now.updatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}
