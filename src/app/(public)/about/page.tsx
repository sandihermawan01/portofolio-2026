import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ParallaxBanner } from "@/components/portfolio/parallax-banner";
import { ScrollReveal } from "@/components/portfolio/scroll-reveal";
import { TechStackPie } from "@/components/portfolio/tech-stack-pie";
import { SkillBarsChart } from "@/components/portfolio/skill-bars-chart";
import { cn } from "@/lib/utils";
import { getProfile } from "@/features/about/queries";
import { withSkillShares } from "@/lib/skills";

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

  const skillsWithShare = withSkillShares(profile.skills);

  return (
    <div className="pb-16">
      <ParallaxBanner index="01 / ABOUT" title={profile.name} subtitle={profile.role} imageUrl={profile.avatarUrl} />

      <div className="container-editorial grid gap-10 sm:grid-cols-[2fr_1fr]">
        <div>
          <ScrollReveal>
            {profile.location && <p className="font-mono text-xs text-muted-foreground">{profile.location}</p>}
            <p className={cn("whitespace-pre-line leading-relaxed", profile.location ? "mt-4" : "")}>{profile.bio}</p>
          </ScrollReveal>

          {profile.stats.length > 0 && (
            <ScrollReveal delayMs={80} className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {profile.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="transition-transform duration-300 ease-out hover:-translate-y-1"
                >
                  <p className="font-display text-3xl font-medium">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </ScrollReveal>
          )}

          {skillsWithShare.length > 0 && (
            <ScrollReveal delayMs={160} className="mt-10">
              <h3 className="index-label mb-3">TECH STACK</h3>
              <TechStackPie skills={skillsWithShare} />
            </ScrollReveal>
          )}

          {profile.socialLinks.length > 0 && (
            <ScrollReveal delayMs={240} className="mt-10">
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
            </ScrollReveal>
          )}
        </div>

        {profile.avatarUrl && (
          <ScrollReveal delayMs={80} className="group relative aspect-square h-fit overflow-hidden rounded-sm border border-border">
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              fill
              sizes="320px"
              className="object-cover grayscale transition-all duration-500 ease-out group-hover:scale-105 group-hover:grayscale-0"
            />
          </ScrollReveal>
        )}
      </div>

      {profile.skillBars.length > 0 && (
        <ScrollReveal className="container-editorial mt-10" delayMs={120}>
          <h3 className="index-label mb-6">MY SKILLS</h3>
          <SkillBarsChart skills={profile.skillBars} />
        </ScrollReveal>
      )}
    </div>
  );
}
