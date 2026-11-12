/**
 * Tiny retro "blip" sound effects, generated on the fly via the Web Audio
 * API oscillator — no audio asset files, no new dependency. Muted by
 * default; the person has to explicitly turn it on via SoundToggle before
 * anything ever plays.
 *
 * Client-only module (no "use client" needed — it exports plain functions,
 * not a component — but every function here guards for `typeof window`
 * since it can still be imported from a file that's part of a server
 * bundle's module graph).
 */

const STORAGE_KEY = "uisound";

// Cached in memory so hot paths (hover/click delegation in SoundEffects)
// don't hit localStorage on every single pointer move.
let cachedEnabled: boolean | null = null;
let audioCtx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (cachedEnabled !== null) return cachedEnabled;
  if (typeof window === "undefined") return false;
  try {
    cachedEnabled = window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    cachedEnabled = false;
  }
  return cachedEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  cachedEnabled = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Not remembered next time, but still works for this page view.
  }
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  // Browsers start a freshly-created AudioContext "suspended" until a real
  // user gesture resumes it — calling resume() here is a no-op once it's
  // already running, and harmless (fire-and-forget) if it's still blocked.
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Call from inside the toggle's own click handler so the very first blip
 * after turning sound on has an already-unlocked AudioContext to use. */
export function unlockAudio() {
  getContext();
}

/**
 * Plays a short square-wave blip at `frequency` for `durationMs`. A linear
 * attack + exponential decay envelope keeps it from popping/clicking at
 * the start/end — a bare on/off gain would sound like a harsh click.
 */
export function playBlip(frequency: number, durationMs: number, type: OscillatorType = "square") {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;

  const now = ctx.currentTime;
  const duration = durationMs / 1000;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}
