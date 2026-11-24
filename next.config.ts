import type { NextConfig } from "next";

// The Firebase Auth/Firestore emulators run on plain http://127.0.0.1 and
// are only ever used in local development (see README "Menjalankan Firebase
// Emulator" + src/lib/firebase/client.ts, gated behind
// NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true). Allowing them in connect-src is
// safe ONLY outside production — they must never be reachable from a
// deployed CSP, so this is conditional on NODE_ENV, not a blanket allow.
// Ports here must match firebase.json's "emulators" block.
const isDev = process.env.NODE_ENV !== "production";
const emulatorConnectSrc = isDev ? " http://127.0.0.1:9099 http://127.0.0.1:8089" : "";

// Newer Next.js dev builds (React's dev-mode error overlay, Turbopack HMR)
// call eval() for things like reconstructing stack traces across module
// boundaries — React itself guarantees it never does this in production, so
// this is safe to allow in dev only. Without it, the page's own CSP (below)
// blocks the eval() call outright, which is the "eval() is not supported in
// this environment" console error. Production keeps the strict policy with
// no 'unsafe-eval' at all.
const devScriptSrc = isDev ? " 'unsafe-eval'" : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${devScriptSrc}`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: https://res.cloudinary.com",
      `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com${emulatorConnectSrc}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `eslint.ignoreDuringBuilds` used to live here — newer Next.js versions
  // dropped support for configuring ESLint from next.config.ts entirely
  // (lint is no longer run as part of `next build` by default at all), so
  // there's nothing to set here anymore. `npm run lint` still runs it
  // explicitly via eslint.config.mjs, same as before.
  // firebase-admin (and its transitive deps: google-auth-library,
  // google-gax/protobufjs, jwks-rsa, …) use Node built-ins and
  // eval-based codegen that only work under the Node.js runtime, never
  // bundled by webpack for a serverless function. Route handlers and
  // Server Components already run on the Node runtime by default, but
  // without this they'd still get bundled (and can break on
  // eval-in-Edge/`node:`-scheme errors) instead of being `require()`d
  // at runtime. Middleware must still never import firebase-admin at
  // all (see src/lib/auth-constants.ts) since it runs on the Edge
  // runtime, where this option doesn't apply.
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Image uploads go through Server Actions as multipart/base64, which
      // inflates the original file size by ~33% — so this must sit above
      // the 2MB client-side cap (see image-upload-field.tsx), not equal to it.
      bodySizeLimit: "3mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
