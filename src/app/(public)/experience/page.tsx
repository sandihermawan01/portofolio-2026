import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { Badge } from "@/components/ui/badge";
import { getExperiences } from "@/features/experience/queries";
import { formatMonthYear } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Experience",
  description: "Riwayat pengalaman kerja.",
};

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  volunteer: "Volunteer",
};

export default async function ExperiencePage() {
  const experiences = await getExperiences();

  return (
    <div className="container-editorial py-16">
      <SectionHeading index="02 / EXPERIENCE" title="Experience" />

      {experiences.length === 0 ? (
        <EmptyState title="Belum ada riwayat pengalaman" description="Tambahkan pengalaman dari dashboard admin." />
      ) : (
        <ol className="space-y-0">
          {experiences.map((exp, i) => (
            <li key={exp.id} className="rule grid gap-2 py-8 sm:grid-cols-[120px_1fr] sm:gap-8 first:border-t-0">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatMonthYear(exp.startDate)} — {exp.isCurrent ? "Sekarang" : exp.endDate ? formatMonthYear(exp.endDate) : ""}
                </p>
              </div>
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-xl font-medium">{exp.title}</h2>
                  <span className="text-muted-foreground">· {exp.company}</span>
                  {exp.isCurrent && <Badge variant="solid">Current</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {EMPLOYMENT_TYPE_LABEL[exp.employmentType] ?? exp.employmentType}
                  {exp.location ? ` · ${exp.location}` : ""}
                </p>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">{exp.description}</p>
                {exp.skills.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {exp.skills.map((skill) => (
                      <li key={skill}>
                        <Badge variant="outline">{skill}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
