import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        paper: "hsl(var(--paper))",
        ink: "hsl(var(--ink))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        grain: "url('/images/grain.svg')",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        // Mobile nav Sheet panel — slides in from/out to the right edge it's
        // docked to. Driven by Radix's own `data-state` attribute (see
        // `sheet.tsx`), which also lets Radix's Presence wait for this exit
        // animation to actually finish before unmounting the panel, instead
        // of it just vanishing instantly on close.
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.4)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.8" },
          "80%, 100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "pixel-tile-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pixel-tile-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "40%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },
        "theme-flip": {
          "0%": { transform: "scaleX(1) rotate(0deg)" },
          "35%": { transform: "scaleX(0.1) rotate(80deg)" },
          "65%": { transform: "scaleX(0.1) rotate(100deg)" },
          "100%": { transform: "scaleX(1) rotate(360deg)" },
        },
        // Page-transition v3 — "CRT power-off/power-on": the page content
        // itself pinches down to a thin horizontal line and back, the way
        // an old CRT television collapses when switched off. Pure
        // transform + opacity (no overlay, no flat color block anywhere),
        // so there's never a sudden large-area color change — just motion.
        // Page-transition "dynamic shards": each tile gets its own random
        // rotation/offset via CSS custom properties set inline per-tile
        // (--rot/--tx/--ty), referenced here so one keyframe definition
        // still produces a different little flight path for every tile.
        "pixel-shard-in": {
          "0%": { transform: "scale(0) rotate(var(--rot, 0deg)) translate(var(--tx, 0), var(--ty, 0))", opacity: "0" },
          "60%": {
            transform:
              "scale(1.12) rotate(calc(var(--rot, 0deg) * 0.2)) translate(calc(var(--tx, 0) * 0.2), calc(var(--ty, 0) * 0.2))",
            opacity: "1",
          },
          "100%": { transform: "scale(1) rotate(0deg) translate(0, 0)", opacity: "1" },
        },
        "pixel-shard-out": {
          "0%": { transform: "scale(1) rotate(0deg) translate(0, 0)", opacity: "1" },
          "40%": {
            transform:
              "scale(1.12) rotate(calc(var(--rot, 0deg) * 0.2)) translate(calc(var(--tx, 0) * 0.2), calc(var(--ty, 0) * 0.2))",
            opacity: "1",
          },
          "100%": { transform: "scale(0) rotate(var(--rot, 0deg)) translate(var(--tx, 0), var(--ty, 0))", opacity: "0" },
        },
        "crt-collapse": {
          "0%": { transform: "scaleY(1) scaleX(1)", opacity: "1" },
          "60%": { transform: "scaleY(0.35) scaleX(0.98)", opacity: "0.75" },
          "100%": { transform: "scaleY(0.02) scaleX(0.85)", opacity: "0" },
        },
        "crt-expand": {
          "0%": { transform: "scaleY(0.02) scaleX(0.85)", opacity: "0" },
          "45%": { transform: "scaleY(0.35) scaleX(0.98)", opacity: "0.75" },
          "80%": { transform: "scaleY(1.02) scaleX(1.005)", opacity: "1" },
          "100%": { transform: "scaleY(1) scaleX(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "fade-out": "fade-out 180ms ease-in",
        "slide-in-right": "slide-in-right 300ms cubic-bezier(0.16,1,0.3,1) both",
        "slide-out-right": "slide-out-right 220ms cubic-bezier(0.6,0,0.8,0.2) both",
        blink: "blink 1s step-end infinite",
        "fade-in-up": "fade-in-up 500ms ease-out both",
        "scale-in": "scale-in 400ms cubic-bezier(0.16,1,0.3,1) both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "pixel-tile-in": "pixel-tile-in 200ms ease-out both",
        "pixel-tile-out": "pixel-tile-out 200ms ease-in both",
        "theme-flip": "theme-flip 420ms steps(7, end) both",
        "pixel-shard-in": "pixel-shard-in 220ms cubic-bezier(0.2,0.8,0.3,1.3) both",
        "pixel-shard-out": "pixel-shard-out 200ms cubic-bezier(0.6,0,0.8,0.2) both",
        "crt-collapse": "crt-collapse 220ms cubic-bezier(0.4,0,1,1) both",
        "crt-expand": "crt-expand 260ms cubic-bezier(0,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
