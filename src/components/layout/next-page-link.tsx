"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Same page order as the navbar (`BASE_NAV_ITEMS` + the conditional GitHub
 * item) — kept here as its own list rather than imported, since the
 * navbar's list is private to that file.
 */
const PAGE_ORDER = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/project", label: "Project" },
] as const;

const GITHUB_ITEM = { href: "/github", label: "GitHub Activity" } as const;
const CONTACT_ITEM = { href: "/contact", label: "Contact" } as const;

/**
 * Rendered once, at the bottom of every public page (see
 * `(public)/layout.tsx`), right before the footer — a simple Previous/Next
 * pager pinned to the left and right edges of the container, not a
 * heading-sized block. Page order matches the navbar; it wraps around at
 * both ends (Home's "Previous" goes to the last page, the last page's
 * "Next" goes back to Home), so both buttons are always present on every
 * page.
 *
 * `showGithubLink` mirrors the navbar's own prop (from
 * `github/config.widgetVisible`) so this never points at the public
 * /github page while the admin has it turned off.
 */
export function NextPageLink({ showGithubLink = false }: { showGithubLink?: boolean }) {
  const pathname = usePathname();

  const order = showGithubLink ? [...PAGE_ORDER, GITHUB_ITEM, CONTACT_ITEM] : [...PAGE_ORDER, CONTACT_ITEM];

  const currentIndex = order.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(item.href + "/")
  );

  if (currentIndex === -1) return null;

  const prev = order[(currentIndex - 1 + order.length) % order.length]!;
  const next = order[(currentIndex + 1) % order.length]!;

  return (
    <div className="container-editorial rule mt-16 flex items-center justify-between pt-8 pb-10">
      <Button asChild variant="outline">
        <Link href={prev.href}>
          <span aria-hidden="true">←</span> {prev.label}
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={next.href}>
          {next.label} <span aria-hidden="true">→</span>
        </Link>
      </Button>
    </div>
  );
}
