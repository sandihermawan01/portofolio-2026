import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { Badge } from "@/components/ui/badge";
import { getPublishedProjects } from "@/features/projects/queries";

export const metadata: Metadata = {
  title: "Project",
  description: "Daftar proyek yang telah dikerjakan.",
};

export default async function ProjectListPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="container-editorial py-16">
      <SectionHeading index="03 / PROJECT" title="Project" />

      {projects.length === 0 ? (
        <EmptyState title="Belum ada project dipublikasikan" description="Project akan tampil setelah dipublikasikan dari dashboard admin." />
      ) : (
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
          {projects.map((project, i) => (
            <Link
              key={project.id}
              href={`/project/${project.slug}`}
              className="group flex flex-col justify-between gap-6 bg-background p-6 transition-colors hover:bg-accent"
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                  {project.featured && <Badge variant="solid">Featured</Badge>}
                </div>
                <h2 className="mt-3 font-display text-xl font-medium group-hover:underline">{project.title}</h2>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
