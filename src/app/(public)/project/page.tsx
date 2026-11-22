import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { Badge } from "@/components/ui/badge";
import { PixelCursorImage } from "@/components/portfolio/pixel-cursor-image";
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
                className="group relative block min-h-[280px] overflow-hidden bg-background"
              >
                {/* image slides in from the right on hover */}
                {previewImage && (
                  <div className="absolute inset-0 translate-x-[110%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0">
                    <PixelCursorImage src={previewImage} alt={project.title} />
                  </div>
                )}

                {/* default content: slides out left + fades as the image comes in */}
                <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between gap-6 p-8 transition-all duration-500 ease-out group-hover:-translate-x-8 group-hover:opacity-0 group-hover:pointer-events-none">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                    {project.featured && <Badge variant="solid">Featured</Badge>}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-medium">{project.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
                  </div>
                  {project.technologies.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {project.technologies.slice(0, 5).map((tech) => (
                        <li key={tech}>
                          <Badge variant="outline">{tech}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* title reappears tucked in the corner once the image has settled */}
                {previewImage && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-end p-5">
                    <span className="w-fit max-w-[80%] translate-y-3 scale-95 rounded-sm border border-border bg-background/85 px-3 py-1.5 font-display text-lg font-medium opacity-0 backdrop-blur-sm transition-all delay-500 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
                      {project.title}
                    </span>
                  </div>
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
