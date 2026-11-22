import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { DeveloperHero } from "@/components/portfolio/developer-hero";
import { getProfile } from "@/features/about/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { getExperiences } from "@/features/experience/queries";
import { getGithubConfig, getGithubCache } from "@/features/github/queries";
import { EmptyState } from "@/components/portfolio/empty-state";
import { StatCell } from "@/components/portfolio/stat-cell";
import { ScrollReveal } from "@/components/portfolio/scroll-reveal";
import { formatMonthYear } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Home",
};

export const revalidate = 0; // always reflect latest admin edits; see README on caching strategy

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  volunteer: "Volunteer",
};

const REPO_STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  planning: "Direncanakan",
  paused: "Jeda",
  completed: "Selesai",
};

export default async function HomePage() {
  const [profile, projects, experiences, githubConfig, githubCache] = await Promise.all([
    getProfile(),
    getPublishedProjects(),
    getExperiences(),
    getGithubConfig(),
    getGithubCache(),
  ]);
  const featured = projects.slice(0, 3);
  const latestExperience = experiences[0] ?? null;
  // Same gate as the navbar/admin-overview GitHub summary: only surface this
  // once the admin has turned the feature on and a repo has actually synced.
  const topRepo = githubConfig.widgetVisible ? (githubCache.repos[0] ?? null) : null;

  const repoCount = githubConfig.widgetVisible ? githubCache.repos.length : 0;
  const skillCount = profile?.skills?.length ?? 0;
  // Only worth showing once there's actually something to count — a fresh
  // install with nothing filled in yet would otherwise show a row of
  // four zeros, which reads as broken rather than "quiet".
  const hasStats = experiences.length > 0 || projects.length > 0 || skillCount > 0 || repoCount > 0;

  return (
    <div className="pb-16 sm:pb-24">
      <DeveloperHero
        name={profile?.name || "Nama belum diisi"}
        role={profile?.role || "Role belum diisi"}
        skills={profile?.skills?.map((s) => s.name)}
      />

      <div className="container-editorial">
        {profile?.bio && (
          <ScrollReveal>
            <p className="max-w-none px-4 text-base leading-relaxed text-muted-foreground sm:px-6 sm:text-lg">
              {profile.bio}
            </p>
          </ScrollReveal>
        )}

        {hasStats && (
          <ScrollReveal delayMs={80} className="mt-10">
            <section
              aria-label="Statistik singkat"
              className="flex flex-wrap justify-center gap-x-10 gap-y-6 sm:justify-start"
            >
              {experiences.length > 0 && <StatCell value={experiences.length} label="EXPERIENCE" />}
              {projects.length > 0 && <StatCell value={projects.length} label="PROJECT" />}
              {skillCount > 0 && <StatCell value={skillCount} label="SKILL" />}
              {repoCount > 0 && <StatCell value={repoCount} label="REPO" />}
            </section>
          </ScrollReveal>
        )}

        {profile?.skills && profile.skills.length > 0 && (
          <ScrollReveal className="rule mt-16 pt-8">
            <section aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="index-label mb-4">
                SKILLS
              </h2>
              <ul className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <li
                    key={skill.name}
                    className="motion-safe:animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "forwards" }}
                  >
                    <Badge variant="outline" className="transition-transform duration-150 hover:-translate-y-0.5">
                      {skill.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        )}

        {latestExperience && (
          <ScrollReveal className="rule mt-16 pt-8">
            <section aria-labelledby="experience-heading">
              <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="experience-heading" className="index-label">
                  EXPERIENCE
                </h2>
                <Link href="/experience" className="text-sm underline underline-offset-4">
                  Lihat semua
                </Link>
              </div>

              <Link href="/experience" className="brutalist-hover group block p-7">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-2xl font-medium group-hover:underline">
                    {latestExperience.title}
                  </h3>
                  <span className="text-base text-muted-foreground">· {latestExperience.company}</span>
                  {latestExperience.isCurrent && <Badge variant="solid">Current</Badge>}
                </div>
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  {formatMonthYear(latestExperience.startDate)} —{" "}
                  {latestExperience.isCurrent
                    ? "Sekarang"
                    : latestExperience.endDate
                      ? formatMonthYear(latestExperience.endDate)
                      : ""}
                  {" · "}
                  {EMPLOYMENT_TYPE_LABEL[latestExperience.employmentType] ?? latestExperience.employmentType}
                </p>
                <p className="mt-3 line-clamp-2 text-base text-muted-foreground">{latestExperience.description}</p>
              </Link>
            </section>
          </ScrollReveal>
        )}

        {topRepo && (
          <ScrollReveal className="rule mt-16 pt-8">
            <section aria-labelledby="github-heading">
              <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="github-heading" className="index-label">
                  CURRENTLY DEVELOPING
                </h2>
                <Link href="/github" className="text-sm underline underline-offset-4">
                  Lihat GitHub Activity
                </Link>
              </div>

              <Link
                href={topRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="brutalist-hover group block p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 break-words font-mono text-base text-muted-foreground">
                    {topRepo.owner}/{topRepo.name}
                  </p>
                  <Badge variant="outline" className="shrink-0">
                    {REPO_STATUS_LABEL[topRepo.status] ?? topRepo.status}
                  </Badge>
                </div>
                {topRepo.description && (
                  <p className="mt-2 line-clamp-2 text-base text-muted-foreground">{topRepo.description}</p>
                )}
                {topRepo.language && (
                  <p className="mt-3 font-mono text-sm text-muted-foreground">{topRepo.language}</p>
                )}
              </Link>
            </section>
          </ScrollReveal>
        )}

        <ScrollReveal className="rule mt-16 pt-8">
          <section aria-labelledby="featured-heading">
            <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="featured-heading" className="index-label">
                SELECTED PROJECTS
              </h2>
              <Link href="/project" className="text-sm underline underline-offset-4">
                Lihat semua
              </Link>
            </div>

            {featured.length === 0 ? (
              <EmptyState
                title="Belum ada project dipublikasikan"
                description="Project akan muncul di sini setelah dipublikasikan dari dashboard admin."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((project, i) => {
                  const previewImage = project.coverImageUrl || project.gallery[0];
                  return (
                    <ScrollReveal key={project.id} delayMs={i * 100}>
                      <Link href={`/project/${project.slug}`} className="brutalist-hover group block">
                        <div className="relative aspect-video w-full overflow-hidden border border-border bg-muted">
                          {previewImage ? (
                            <Image
                              src={previewImage}
                              alt={project.title}
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="p-7">
                          <p className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                          <h3 className="mt-2 font-display text-2xl font-medium group-hover:underline">
                            {project.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-base text-muted-foreground">{project.summary}</p>
                        </div>
                      </Link>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
