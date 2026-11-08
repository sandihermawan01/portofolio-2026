import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * Client-safe values (NEXT_PUBLIC_*) and server-only secrets are kept in
 * separate schemas so a server secret can never accidentally be imported
 * into a Client Component bundle. `serverEnv` must only be imported from
 * server-only files (route handlers, server actions, `lib/firebase/admin.ts`).
 */

const clientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "NEXT_PUBLIC_FIREBASE_API_KEY is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

function loadClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    // Thrown at module-eval time so a misconfigured deploy fails fast
    // instead of rendering a broken page.
    throw new Error(
      `Invalid client environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  return parsed.data;
}

export const clientEnv = loadClientEnv();

const serverSchema = z.object({
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1, "FIREBASE_ADMIN_PROJECT_ID is required"),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1, "FIREBASE_ADMIN_PRIVATE_KEY is required"),
  ADMIN_UID_ALLOWLIST: z.string().default(""),
  SESSION_COOKIE_SECRET: z.string().min(16, "SESSION_COOKIE_SECRET must be at least 16 characters"),
  SESSION_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().max(60 * 60 * 24 * 14).default(432000),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  CONTACT_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(3600),
  // Cloudinary (image uploads) — replaces Firebase Storage, which requires
  // the paid "Blaze" plan. See lib/media/cloudinary-upload.ts. Server-only:
  // CLOUDINARY_API_SECRET in particular must never reach the browser.
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  // GitHub Activity integration — entirely OPTIONAL. Unlike Firebase/
  // Cloudinary above, a missing value here must never crash the app: the
  // feature simply renders an empty/"not configured" state (see
  // src/lib/github/client.ts and src/app/(public)/github/page.tsx). Never
  // prefix any of these with NEXT_PUBLIC_ — the PAT and both secrets must
  // stay server-only.
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_SYNC_CRON_SECRET: z.string().optional(),
  GITHUB_SYNC_CACHE_TTL_MINUTES: z.coerce.number().int().positive().default(360),
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

/**
 * Lazily validated so this module can be imported without throwing during
 * `next build`'s client bundling analysis; the throw only happens the first
 * time a server-only caller actually reads a value.
 */
export function getServerEnv() {
  if (cachedServerEnv) return cachedServerEnv;

  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() must never be called from the client.");
  }

  const parsed = serverSchema.safeParse({
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    ADMIN_UID_ALLOWLIST: process.env.ADMIN_UID_ALLOWLIST,
    SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
    SESSION_EXPIRES_IN_SECONDS: process.env.SESSION_EXPIRES_IN_SECONDS,
    CONTACT_RATE_LIMIT_MAX: process.env.CONTACT_RATE_LIMIT_MAX,
    CONTACT_RATE_LIMIT_WINDOW_SECONDS: process.env.CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    GITHUB_SYNC_CRON_SECRET: process.env.GITHUB_SYNC_CRON_SECRET,
    GITHUB_SYNC_CACHE_TTL_MINUTES: process.env.GITHUB_SYNC_CACHE_TTL_MINUTES,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getAdminAllowlist(): string[] {
  return getServerEnv()
    .ADMIN_UID_ALLOWLIST.split(",")
    .map((uid) => uid.trim())
    .filter(Boolean);
}

/** Whether the GitHub Activity feature has enough configuration to call the
 * GitHub API at all. Checked before every sync attempt so a portfolio
 * owner who hasn't set up GITHUB_TOKEN yet gets a clear "not configured"
 * state instead of a confusing fetch failure. */
export function isGithubIntegrationConfigured(): boolean {
  return Boolean(getServerEnv().GITHUB_TOKEN);
}
