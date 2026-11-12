import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ExperienceItem } from "@/components/portfolio/experience-item";
import { getExperiences } from "@/features/experience/queries";

export const metadata: Metadata = {
  title: "Experience",
  description: "Riwayat pengalaman kerja.",
};

export default async function ExperiencePage() {
  const experiences = await getExperiences();

  return (
    <div className="container-editorial py-16">
      <SectionHeading index="03 / EXPERIENCE" title="Experience" />

      {experiences.length === 0 ? (
        <EmptyState title="Belum ada riwayat pengalaman" description="Tambahkan pengalaman dari dashboard admin." />
      ) : (
        <ol className="space-y-0">
          {experiences.map((exp, i) => (
            <ExperienceItem key={exp.id} experience={exp} index={i} />
          ))}
        </ol>
      )}
    </div>
  );
}
