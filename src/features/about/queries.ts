import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { ContactInfo, Profile } from "@/types/content";
import { timestampToIso } from "@/lib/firebase/convert";

const PROFILE_DOC_PATH = ["site", "profile"] as const;
const CONTACT_DOC_PATH = ["site", "contact"] as const;

/** Public read. Returns null if the owner hasn't filled in a profile yet. */
export async function getProfile(): Promise<Profile | null> {
  const snap = await adminDb.doc(PROFILE_DOC_PATH.join("/")).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    name: data.name ?? "",
    role: data.role ?? "",
    bio: data.bio ?? "",
    location: data.location ?? undefined,
    avatarUrl: data.avatarUrl ?? undefined,
    skills: data.skills ?? [],
    socialLinks: data.socialLinks ?? [],
    updatedAt: timestampToIso(data.updatedAt),
  };
}

/** Public read. Returns null if the owner hasn't filled in contact info yet. */
export async function getContactInfo(): Promise<ContactInfo | null> {
  const snap = await adminDb.doc(CONTACT_DOC_PATH.join("/")).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    email: data.email ?? "",
    location: data.location ?? undefined,
    socialLinks: data.socialLinks ?? [],
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export const PROFILE_DOC_REF_PATH = PROFILE_DOC_PATH.join("/");
export const CONTACT_DOC_REF_PATH = CONTACT_DOC_PATH.join("/");
