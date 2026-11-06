"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Briefcase, FolderKanban, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/about", label: "About", icon: User },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border p-6 md:flex">
      <div className="mb-8">
        <p className="index-label">ADMIN</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
      </div>

      <nav aria-label="Navigasi admin" className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <LogoutButton />
    </aside>
  );
}
