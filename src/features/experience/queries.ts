import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/convert";
import type { Experience } from "@/types/content";
import type { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

function toExperience(doc: QueryDocumentSnapshot<DocumentData>): Experience {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title ?? "",
    company: data.company ?? "",
    employmentType: data.employmentType ?? "full-time",
    location: data.location ?? undefined,
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? undefined,
    isCurrent: data.isCurrent ?? false,
    description: data.description ?? "",
    skills: data.skills ?? [],
    sortOrder: data.sortOrder ?? 0,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

/** Public + admin: all experience entries, newest first (by startDate),
 * with manual `sortOrder` as a tiebreaker for same-date entries. */
export async function getExperiences(): Promise<Experience[]> {
  const snap = await adminDb.collection("experiences").get();
  const items = snap.docs.map(toExperience);
  return items.sort((a, b) => {
    // Current roles first, then most recent start date, then sortOrder.
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    const dateDiff = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.sortOrder - b.sortOrder;
  });
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  const snap = await adminDb.collection("experiences").doc(id).get();
  if (!snap.exists) return null;
  return toExperience(snap as QueryDocumentSnapshot<DocumentData>);
}
