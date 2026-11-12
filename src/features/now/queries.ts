import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/convert";
import type { NowContent } from "@/types/content";

const NOW_DOC_PATH = ["site", "now"] as const;

/** Public read. Returns null if the owner hasn't filled in a "Now" entry
 * yet — the public page shows an EmptyState in that case instead of a
 * blank/broken layout, same pattern as getProfile/getContactInfo. */
export async function getNowContent(): Promise<NowContent | null> {
  const snap = await adminDb.doc(NOW_DOC_PATH.join("/")).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    headline: data.headline ?? "",
    body: data.body ?? "",
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export const NOW_DOC_REF_PATH = NOW_DOC_PATH.join("/");
