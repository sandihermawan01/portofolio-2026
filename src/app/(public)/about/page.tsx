import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ParallaxBanner } from "@/components/portfolio/parallax-banner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getProfile } from "@/features/about/queries";

export const metadata: Metadata = {
  title: "About",
  description: "Profil, bio, dan keahlian.",
};

export default async function AboutPage() {
  const profile = await getProfile();

  if (!profile || !profile.name) {
    return (
      <div className="container-editorial py-16">
        <SectionHeading index="01 / ABOUT" title="About" />
        <EmptyState title="Profil belum diisi" description="Pemilik website belum mengisi profil dari dashboard admin." />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <ParallaxBanner index="01 / ABOUT" title={profile.name} subtitle={profile.role} imageUrl={profile.avatarUrl} />

      <div className="container-editorial grid gap-10 sm:grid-cols-[2fr_1fr]">
        <div>
          {profile.location && <p className="font-mono text-xs text-muted-foreground">{profile.location}</p>}
          <p className={cn("whitespace-pre-line leading-relaxed", profile.location ? "mt-4" : "")}>{profile.bio}</p>

          {profile.skills.length > 0 && (
            <div className="mt-10">
              <h3 className="index-label mb-3">SKILLS</h3>
              <ul className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <li key={skill}>
                    <Badge variant="outline">{skill}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.socialLinks.length > 0 && (
            <div className="mt-10">
              <h3 className="index-label mb-3">SOCIAL</h3>
              <ul className="space-y-2">
                {profile.socialLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline-offset-4 hover:underline"
                    >
                      {link.label} ↗
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {profile.avatarUrl && (
          <div className="relative aspect-square h-fit overflow-hidden rounded-sm border border-border">
            <Image src={profile.avatarUrl} alt={profile.name} fill sizes="320px" className="object-cover grayscale" />
          </div>
        )}
      </div>
    </div>
  );
}
