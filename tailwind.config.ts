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
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        blink: "blink 1s step-end infinite",
        "fade-in-up": "fade-in-up 500ms ease-out both",
        "scale-in": "scale-in 400ms cubic-bezier(0.16,1,0.3,1) both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "pixel-tile-in": "pixel-tile-in 200ms ease-out both",
        "pixel-tile-out": "pixel-tile-out 200ms ease-in both",
        "theme-flip": "theme-flip 420ms steps(7, end) both",
      },
    },
  },
  plugins: [],
};

export default config;
