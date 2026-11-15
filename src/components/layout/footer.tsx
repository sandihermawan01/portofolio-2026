import Link from "next/link";
import type { SocialLink } from "@/types/content";
import { HitCounter } from "@/components/portfolio/hit-counter";

export function Footer({
  ownerName,
  socialLinks,
  visitCount,
}: {
  ownerName: string;
  socialLinks: SocialLink[];
  /** Omitted entirely (not just 0) when the counter couldn't be read, so
   * the footer degrades gracefully instead of showing a misleading 000000. */
  visitCount?: number;
}) {
  return (
    <footer className="rule mt-24">
      {/* One thin row, everything vertically centered on the same
          baseline — this used to be two separate stacked blocks (the
          hit counter sat in its own full-width row below, with its own
          bottom padding), which is what made the footer read as
          unevenly tall. Copyright anchors the left edge; social links
          and the hit counter share the right side so they line up next
          to each other instead of each claiming a whole row. */}
      <div className="container-editorial flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
        <p className="index-label">
          © {new Date().getFullYear()} {ownerName || "Portfolio"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
          {socialLinks.length > 0 && (
            <nav aria-label="Tautan sosial" className="flex flex-wrap items-center gap-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          {typeof visitCount === "number" && <HitCounter count={visitCount} />}
        </div>
      </div>
    </footer>
  );
}
