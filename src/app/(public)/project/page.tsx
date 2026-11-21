import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { Badge } from "@/components/ui/badge";
import { getPublishedProjects } from "@/features/projects/queries";
import { getGithubConfig } from "@/features/github/queries";

export const metadata: Metadata = {
  title: "Project",
  description: "Daftar proyek yang telah dikerjakan.",
};

export default async function ProjectListPage() {
  const [projects, githubConfig] = await Promise.all([getPublishedProjects(), getGithubConfig()]);

  return (
    <div className="container-editorial py-16">
      <SectionHeading index="04 / PROJECT" title="Project" />

      {projects.length === 0 ? (
        <EmptyState title="Belum ada project dipublikasikan" description="Project akan tampil setelah dipublikasikan dari dashboard admin." />
      ) : (
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
          {projects.map((project, i) => {
            const previewImage = project.coverImageUrl || project.gallery[0];
            return (
              <Link
                key={project.id}
                href={`/project/${project.slug}`}
                className="group relative flex flex-col justify-between gap-6 overflow-hidden bg-background p-8 transition-colors hover:bg-accent"
              >
                {/* Background image, not a separate block — grayscale and
                    invisible at rest, fading up to a low max opacity on
                    hover so it never competes with the text on top. */}
                {previewImage && (
                  <Image
                    src={previewImage}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-0 grayscale transition-opacity duration-700 ease-out group-hover:opacity-15"
                  />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                    {project.featured && <Badge variant="solid">Featured</Badge>}
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium group-hover:underline">{project.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
                </div>
                {project.technologies.length > 0 && (
                  <ul className="relative flex flex-wrap gap-2">
                    {project.technologies.slice(0, 5).map((tech) => (
                      <li key={tech}>
                        <Badge variant="outline">{tech}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {githubConfig.widgetVisible && (
        <div className="rule mt-16 pt-8">
          <Link href="/github" className="group flex items-center justify-between">
            <span>
              <span className="index-label">GITHUB ACTIVITY</span>
              <span className="mt-1 block font-display text-xl font-medium group-hover:underline">
                Lihat apa yang sedang dikerjakan di GitHub →
              </span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
