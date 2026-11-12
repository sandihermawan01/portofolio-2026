import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { NextPageLink } from "@/components/layout/next-page-link";
import { PixelTransitionOverlay } from "@/components/layout/pixel-transition-overlay";
import { CommandPalette, type CommandItem } from "@/components/layout/command-palette";
import { EasterEgg } from "@/components/layout/easter-egg";
import { SoundEffects } from "@/components/layout/sound-effects";
import { getProfile, getContactInfo } from "@/features/about/queries";
import { getGithubConfig } from "@/features/github/queries";
import { getPublishedProjects } from "@/features/projects/queries";
import { incrementAndGetVisitCount } from "@/features/stats/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // `incrementAndGetVisitCount` runs once per full mount of this shared
  // layout (hard navigation / first visit), not on every client-side route
  // change within it — see HitCounter/features/stats for why that's the
  // intended "page load" semantics, not unique-visitor tracking. It's
  // wrapped so a transient Firestore hiccup never breaks the whole site:
  // the footer just omits the counter for that one request.
  const [profile, contact, githubConfig, projects, visitCount] = await Promise.all([
    getProfile(),
    getContactInfo(),
    getGithubConfig(),
    getPublishedProjects(),
    incrementAndGetVisitCount().catch(() => undefined),
  ]);
  const ownerName = profile?.name ?? "";
  const socialLinks = contact?.socialLinks ?? profile?.socialLinks ?? [];

  const commandItems: CommandItem[] = [
    { href: "/", label: "Home", hint: "Halaman" },
    { href: "/about", label: "About", hint: "Halaman" },
    { href: "/now", label: "Now", hint: "Halaman" },
    { href: "/experience", label: "Experience", hint: "Halaman" },
    { href: "/project", label: "Project", hint: "Halaman" },
    ...(githubConfig.widgetVisible ? [{ href: "/github", label: "GitHub Activity", hint: "Halaman" }] : []),
    { href: "/contact", label: "Contact", hint: "Halaman" },
    ...projects.map((p) => ({ href: `/project/${p.slug}`, label: p.title, hint: "Project" })),
  ];

  return (
    <PixelTransitionOverlay>
      <div className="flex min-h-screen flex-col">
        <Navbar ownerName={ownerName} showGithubLink={githubConfig.widgetVisible} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
          <NextPageLink showGithubLink={githubConfig.widgetVisible} />
        </main>
        <Footer ownerName={ownerName} socialLinks={socialLinks} visitCount={visitCount} />
      </div>
      <CommandPalette items={commandItems} />
      <EasterEgg />
      <SoundEffects />
    </PixelTransitionOverlay>
  );
}
