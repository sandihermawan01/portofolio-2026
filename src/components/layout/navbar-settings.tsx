"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/i18n/language-toggle";

/**
 * Desktop-only: holds just Theme + Language — the two toggles that already
 * share the same pill style (icon + uppercase label). Sound and CRT stay as
 * their own icon-only buttons directly in the navbar instead of coming in
 * here: mixing bare icon squares with labeled pills in one dropdown looked
 * inconsistent, so the popover only groups toggles that actually match.
 */
export function NavbarSettings() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pengaturan tampilan"
          className="group border border-border transition-colors hover:bg-accent data-[state=open]:bg-accent"
        >
          <Settings
            className="h-4 w-4 transition-transform duration-300 ease-out group-hover:rotate-90 group-data-[state=open]:rotate-90"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-auto flex-col gap-2 border-border bg-background/80 p-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
        data-no-translate
      >
        <LanguageToggle />
        <ThemeToggle />
      </PopoverContent>
    </Popover>
  );
}
