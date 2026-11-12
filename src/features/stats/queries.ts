import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const STATS_DOC_PATH = "site/stats";

/**
 * Old-web "hit counter" — counts full page loads of the public layout
 * (first visit / hard navigation), not unique visitors. This is a
 * deliberate nod to the retro genre this feature is styled after (think
 * "You are visitor #00001234"), not an analytics feature, so it's kept as
 * simple as a single incrementing Firestore counter rather than anything
 * session/cookie-based.
 *
 * A Firestore transaction (read-then-write in one atomic step) is used
 * instead of a plain `FieldValue.increment()` set, because the new total
 * needs to be read back and shown immediately in the same request — a
 * bare increment() write doesn't return the resulting value.
 */
export async function incrementAndGetVisitCount(): Promise<number> {
  const ref = adminDb.doc(STATS_DOC_PATH);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data()?.visitCount;
    const next = (typeof current === "number" ? current : 0) + 1;
    tx.set(ref, { visitCount: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return next;
  });
}
