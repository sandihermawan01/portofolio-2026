import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProfile } from "@/features/about/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { EmptyState } from "@/components/portfolio/empty-state";

export const metadata: Metadata = {
  title: "Home",
};

export const revalidate = 0; // always reflect latest admin edits; see README on caching strategy

export default async function HomePage() {
  const [profile, projects] = await Promise.all([getProfile(), getPublishedProjects()]);
  const featured = projects.slice(0, 3);

  return (
    <div className="container-editorial py-16 sm:py-24">
      <section aria-labelledby="hero-heading" className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="index-label mb-4">INDEX — 00 / HOME</p>
          <h1 id="hero-heading" className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            {profile?.name || "Nama belum diisi"}
          </h1>
          <p className="mt-3 text-xl text-muted-foreground">{profile?.role || "Role belum diisi"}</p>
          {profile?.bio && <p className="mt-6 max-w-xl text-muted-foreground">{profile.bio}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/project">Lihat Project</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Hubungi Saya</Link>
            </Button>
          </div>
        </div>
        {profile?.avatarUrl && (
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-sm border border-border sm:mx-0">
            <Image src={profile.avatarUrl} alt={profile.name} fill sizes="160px" className="object-cover grayscale" />
          </div>
        )}
      </section>

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
          <EmptyState title="Belum ada project dipublikasikan" description="Project akan muncul di sini setelah dipublikasikan dari dashboard admin." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project, i) => (
              <Link
                key={project.id}
                href={`/project/${project.slug}`}
                className="group block border border-border p-5 transition-colors hover:bg-accent"
              >
                <p className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-display text-lg font-medium group-hover:underline">{project.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
