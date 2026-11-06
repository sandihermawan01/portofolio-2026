"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/project", label: "Project" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ ownerName }: { ownerName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-editorial flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-base font-semibold tracking-tight">
          {ownerName || "Portfolio"}
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  active ? "text-foreground underline underline-offset-4" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu navigasi">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Menu</SheetTitle>
            <nav aria-label="Navigasi mobile" className="mt-8 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-sm px-3 py-3 text-base font-medium",
                        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
