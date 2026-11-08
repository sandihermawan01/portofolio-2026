import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { GithubActivitySection } from "@/components/portfolio/github/github-activity-section";
import { getGithubConfig, getGithubCache } from "@/features/github/queries";

export const metadata: Metadata = {
  title: "GitHub Activity",
  description: "Aktivitas GitHub terkini — contribution graph, repository yang sedang dikerjakan, dan commit terbaru.",
};

/**
 * Dedicated page rather than a 5th navbar item — the GitHub Activity prompt
 * asks to place this section "setelah Project" while keeping the main nav
 * at exactly About/Experience/Project/Contact. A full page gives the
 * heatmap + repo list + commits room to breathe without crowding the
 * homepage, and is reached via a link from the Project page (and the
 * homepage) rather than a new nav entry — see the "GitHub Activity →" link
 * on /project.
 *
 * 404s (not just an empty state) when the admin hasn't turned the widget
 * on yet, the same way a draft project 404s: there's nothing here to show
 * a visitor, and that's a deliberate owner choice, not a bug.
 */
export default async function GithubActivityPage() {
  const config = await getGithubConfig();
  if (!config.widgetVisible) notFound();

  const cache = await getGithubCache();

  return (
    <div className="container-editorial py-16">
      <Link href="/project" className="index-label mb-8 inline-block hover:underline">
        ← BACK TO PROJECT
      </Link>

      <SectionHeading index="// GITHUB" title="GitHub Activity" lead="Apa yang sedang dikerjakan, langsung dari GitHub." />

      <GithubActivitySection config={config} cache={cache} />
    </div>
  );
}
