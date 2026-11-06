import "server-only";

/**
 * Firebase Admin SDK bootstrap — SERVER ONLY.
 *
 * The `server-only` import makes it a build error if any Client Component
 * ever imports this module, which is the main guardrail against accidentally
 * shipping the service account key to the browser.
 *
 * IMPORTANT: the Admin SDK bypasses Firestore Security Rules entirely.
 * Every function that uses `adminDb`/`adminAuth` MUST perform its own
 * authorization check (see `lib/firebase/auth.ts`) before reading or
 * writing anything on behalf of a request.
 *
 * NOTE: there is no `adminStorage` export here. Image uploads use
 * Cloudinary instead of Firebase Storage (see `lib/media/cloudinary-upload.ts`)
 * because Storage requires the "Blaze" paid plan just to create a bucket —
 * not worth it for a personal portfolio. This project only uses Firebase
 * for Auth + Firestore, both fully usable on the free "Spark" plan.
 */

import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getServerEnv } from "@/config/env";

function createAdminApp(): App {
  if (getApps().length) return getApp();

  const env = getServerEnv();

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // .env files store the key with literal "\n" sequences; convert them
      // back to real newlines, which the PEM parser requires.
      privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const adminApp = createAdminApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
