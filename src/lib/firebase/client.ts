"use client";

/**
 * Firebase CLIENT SDK bootstrap. Safe for the browser — only uses
 * NEXT_PUBLIC_* config, which Firebase's own docs confirm is not a secret
 * (access is governed by Firestore Security Rules, not by hiding this
 * config). Never import `lib/firebase/admin.ts` from here.
 *
 * No Firebase Storage here: image uploads go through Cloudinary instead
 * (see `lib/media/cloudinary-upload.ts`) since Storage needs the paid
 * "Blaze" plan just to create a bucket. This app only uses Firebase for
 * Auth + Firestore, both fine on the free "Spark" plan.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { clientEnv } from "@/config/env";

const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function createFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp = createFirebaseApp();
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);

// Connect to local emulators in development when explicitly enabled, so a
// stray NODE_ENV check can never accidentally point production at them.
declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_EMULATORS_CONNECTED__: boolean | undefined;
}

if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  typeof window !== "undefined" &&
  !globalThis.__FIREBASE_EMULATORS_CONNECTED__
) {
  // Ports must match firebase.json's "emulators" block.
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8089);
  globalThis.__FIREBASE_EMULATORS_CONNECTED__ = true;
}
