import Link from "next/link";
import type { SocialLink } from "@/types/content";

export function Footer({ ownerName, socialLinks }: { ownerName: string; socialLinks: SocialLink[] }) {
  return (
    <footer className="rule mt-24">
      <div className="container-editorial flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <p className="index-label">
          © {new Date().getFullYear()} {ownerName || "Portfolio"}
        </p>
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
      </div>
    </footer>
  );
}
