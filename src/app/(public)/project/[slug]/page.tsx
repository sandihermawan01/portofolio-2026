import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { getPublishedProjectBySlug, getPublishedProjects } from "@/features/projects/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.coverImageUrl ? [{ url: project.coverImageUrl }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) notFound();

  return (
    <article className="container-editorial py-16">
      <Link href="/project" className="index-label mb-8 inline-block hover:underline">
        ← BACK TO PROJECT
      </Link>

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
          {project.featured && <Badge variant="solid">Featured</Badge>}
        </div>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{project.summary}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Live Demo ↗
            </Link>
          )}
          {project.repositoryUrl && (
            <Link
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Repository ↗
            </Link>
          )}
        </div>
      </header>

      {project.coverImageUrl && (
        <div className="relative mb-10 aspect-video overflow-hidden rounded-sm border border-border">
          <Image src={project.coverImageUrl} alt={project.title} fill sizes="(min-width: 1024px) 896px, 100vw" className="object-cover" priority />
        </div>
      )}

      <div className="grid gap-10 sm:grid-cols-[2fr_1fr]">
        <div className="whitespace-pre-line leading-relaxed">{project.description}</div>

        {project.technologies.length > 0 && (
          <aside>
            <h2 className="index-label mb-3">TECH STACK</h2>
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <li key={tech}>
                  <Badge variant="outline">{tech}</Badge>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {project.gallery.length > 0 && (
        <section className="mt-12">
          <h2 className="index-label mb-4">GALLERY</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {project.gallery.map((url) => (
              <div key={url} className="relative aspect-video overflow-hidden rounded-sm border border-border">
                <Image src={url} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
