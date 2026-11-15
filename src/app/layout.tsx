import type { Metadata } from "next";
import Script from "next/script";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RouteProgressBar } from "@/components/layout/route-progress-bar";
import { clientEnv } from "@/config/env";

const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
`;

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Portfolio",
    template: "%s — Portfolio",
  },
  description: "Personal portfolio — about, experience, and projects.",
  openGraph: {
    type: "website",
    siteName: "Portfolio",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Favicon/home-screen icon files live in `public/icons/` (plain static
  // assets, not Next's `app/icon.png` auto-detection convention) so this
  // config is what actually wires them up.
  icons: {
    icon: "/icons/favicon-public-icon.png",
    apple: "/icons/favicon-public-apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className={`${display.variable} ${sans.variable} ${mono.variable} font-sans`}>
        <div className="grain-overlay" aria-hidden="true" />
        <div className="crt-overlay" aria-hidden="true" />
        <RouteProgressBar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
