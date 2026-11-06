import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { DashboardStats } from "@/types/content";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [publishedSnap, draftSnap, experienceSnap] = await Promise.all([
    adminDb.collection("projects").where("status", "==", "published").count().get(),
    adminDb.collection("projects").where("status", "==", "draft").count().get(),
    adminDb.collection("experiences").count().get(),
  ]);

  return {
    publishedProjectCount: publishedSnap.data().count,
    draftProjectCount: draftSnap.data().count,
    experienceCount: experienceSnap.data().count,
  };
}
