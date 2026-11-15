
let enabled = false;
let audioCtx: AudioContext | null = null;
let hasUserGesture = false;
if (typeof window !== "undefined") {
  const markGestureSeen = () => {
    hasUserGesture = true;
  };
  // `once: true` on all three — whichever fires first unregisters itself,
  // the others are left to no-op (harmless) or just never fire.
  window.addEventListener("pointerdown", markGestureSeen, { once: true, capture: true });
  window.addEventListener("keydown", markGestureSeen, { once: true, capture: true });
  window.addEventListener("touchstart", markGestureSeen, { once: true, capture: true });
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || !hasUserGesture) return null;
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
