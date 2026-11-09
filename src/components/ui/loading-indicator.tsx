import { cn } from "@/lib/utils";

/**
 * Small terminal-style loading indicator — three squares stepping through
 * opacity levels, like a progress dial, plus a blinking cursor (reusing
 * the existing `blink` keyframe from tailwind.config.ts). Pure CSS, no JS,
 * so it's safe to drop into any `loading.tsx` Suspense fallback (which
 * must render before any client-side hydration/interactivity exists).
 */
export function LoadingIndicator({ label = "LOADING", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 font-mono text-xs tracking-widest text-muted-foreground", className)}>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-2 w-2 bg-foreground motion-safe:animate-pulse [animation-delay:0ms]" />
        <span className="h-2 w-2 bg-foreground motion-safe:animate-pulse [animation-delay:150ms]" />
        <span className="h-2 w-2 bg-foreground motion-safe:animate-pulse [animation-delay:300ms]" />
      </span>
      <span>
        {label}
        <span className="motion-safe:animate-blink">_</span>
      </span>
    </div>
  );
}
