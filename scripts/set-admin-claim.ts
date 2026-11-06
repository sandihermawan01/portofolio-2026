/**
 * Admin provisioning script — run locally by the project owner only.
 *
 *   npm run seed:admin -- <uid-or-email>
 *
 * Sets the `admin: true` custom claim on a Firebase Auth user. This is
 * intentionally a CLI script, not an API route or UI button: there is no
 * public or in-app way to grant admin access (per the master prompt's "no
 * public sign-up" requirement). The account itself must already exist —
 * create it first in Firebase Console > Authentication > Add user, or via
 * `firebase auth:import`.
 *
 * After running this, also add the same UID to ADMIN_UID_ALLOWLIST in your
 * .env.local — the app checks BOTH the custom claim and the allowlist
 * (see src/lib/firebase/auth.ts), so both must be kept in sync.
 */
import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error("Usage: npm run seed:admin -- <uid-or-email>");
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY in .env.local"
    );
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  const auth = getAuth();
  const user = identifier.includes("@") ? await auth.getUserByEmail(identifier) : await auth.getUser(identifier);

  await auth.setCustomUserClaims(user.uid, { admin: true });

  // Custom claims only take effect on the user's NEXT sign-in (or forced
  // token refresh); revoking existing refresh tokens forces that, so a
  // freshly-provisioned admin doesn't have to guess why /admin still 403s.
  await auth.revokeRefreshTokens(user.uid);

  console.log(`✔ admin claim set for ${user.email ?? user.uid} (uid: ${user.uid})`);
  console.log(`  Add this UID to ADMIN_UID_ALLOWLIST in .env.local:\n  ${user.uid}`);
}

main().catch((err) => {
  console.error("Failed to set admin claim:", err);
  process.exit(1);
});
