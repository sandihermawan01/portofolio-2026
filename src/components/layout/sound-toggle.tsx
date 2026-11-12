"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSoundEnabled, setSoundEnabled, unlockAudio, playBlip } from "@/lib/ui-sound";

/**
 * Muted by default — `on` starts `false` and only ever flips to `true`
 * after mount, once the real saved preference (if any) has been read from
 * localStorage, the same "resolve after mount" pattern ThemeToggle uses.
 */
export function SoundToggle() {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
    if (next) {
      unlockAudio();
      playBlip(880, 60, "square"); // immediate confirmation blip that sound is now on
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={on ? "Matikan efek suara" : "Aktifkan efek suara"}
      aria-pressed={on}
      title="Efek suara retro (percobaan)"
      className={cn("brutalist-hover inline-flex h-10 w-10 items-center justify-center", on && "bg-accent")}
    >
      {on ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
