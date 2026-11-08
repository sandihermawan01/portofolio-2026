"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { LogoutButton } from "./logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/github", label: "GitHub" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminMobileNav({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
      <p className="index-label">ADMIN</p>
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Buka menu admin">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Admin Menu</SheetTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
            <nav aria-label="Navigasi admin mobile" className="mt-8 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
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
            <div className="mt-8">
              <LogoutButton />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
