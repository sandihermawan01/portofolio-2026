import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { DeveloperHero } from "@/components/portfolio/developer-hero";
import { getProfile } from "@/features/about/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { getExperiences } from "@/features/experience/queries";
import { getGithubConfig, getGithubCache } from "@/features/github/queries";
import { EmptyState } from "@/components/portfolio/empty-state";
import { StatCell } from "@/components/portfolio/stat-cell";
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
        skills={profile?.skills}
      />

      <div className="container-editorial">
        {profile?.bio && (
          <p className="motion-safe:animate-fade-in-up max-w-none px-4 text-base leading-relaxed text-muted-foreground sm:px-6 sm:text-lg">
            {profile.bio}
          </p>
        )}

        {hasStats && (
          <section
            aria-label="Statistik singkat"
            className="motion-safe:animate-fade-in-up mt-10 flex flex-wrap gap-x-10 gap-y-6"
          >
            {experiences.length > 0 && <StatCell value={experiences.length} label="EXPERIENCE" />}
            {projects.length > 0 && <StatCell value={projects.length} label="PROJECT" />}
            {skillCount > 0 && <StatCell value={skillCount} label="SKILL" />}
            {repoCount > 0 && <StatCell value={repoCount} label="REPO" />}
          </section>
        )}

        {profile?.skills && profile.skills.length > 0 && (
          <section aria-labelledby="skills-heading" className="rule mt-16 pt-8">
            <h2 id="skills-heading" className="index-label mb-4">
              SKILLS
            </h2>
            <ul className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="outline">{skill}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {latestExperience && (
          <section aria-labelledby="experience-heading" className="rule mt-16 pt-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="experience-heading" className="index-label">
                EXPERIENCE
              </h2>
              <Link href="/experience" className="text-sm underline underline-offset-4">
                Lihat semua
              </Link>
            </div>

            <Link
              href="/experience"
              className="brutalist-hover group block p-7"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-2xl font-medium group-hover:underline">{latestExperience.title}</h3>
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
        )}

        {topRepo && (
          <section aria-labelledby="github-heading" className="rule mt-16 pt-8">
            <div className="mb-6 flex items-center justify-between">
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
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-base text-muted-foreground">
                  {topRepo.owner}/{topRepo.name}
                </p>
                <Badge variant="outline">{REPO_STATUS_LABEL[topRepo.status] ?? topRepo.status}</Badge>
              </div>
              {topRepo.description && (
                <p className="mt-2 line-clamp-2 text-base text-muted-foreground">{topRepo.description}</p>
              )}
              {topRepo.language && <p className="mt-3 font-mono text-sm text-muted-foreground">{topRepo.language}</p>}
            </Link>
          </section>
        )}

        <section aria-labelledby="featured-heading" className="rule mt-16 pt-8">
          <div className="mb-6 flex items-center justify-between">
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
              {featured.map((project, i) => (
                <Link
                  key={project.id}
                  href={`/project/${project.slug}`}
                  className="brutalist-hover group block p-7"
                >
                  <p className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-display text-2xl font-medium group-hover:underline">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-base text-muted-foreground">{project.summary}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
