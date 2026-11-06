import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { timestampToIso } from "@/lib/firebase/convert";
import type { Project } from "@/types/content";
import type { QueryDocumentSnapshot, DocumentData, DocumentSnapshot } from "firebase-admin/firestore";

function toProject(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Project {
  const data = doc.data()!;
  return {
    id: doc.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    summary: data.summary ?? "",
    description: data.description ?? "",
    coverImageUrl: data.coverImageUrl ?? undefined,
    gallery: data.gallery ?? [],
    technologies: data.technologies ?? [],
    liveUrl: data.liveUrl ?? undefined,
    repositoryUrl: data.repositoryUrl ?? undefined,
    featured: data.featured ?? false,
    status: data.status ?? "draft",
    sortOrder: data.sortOrder ?? 0,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function sortProjects(items: Project[]): Project[] {
  return items.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/** Public: published projects only. This filter happens in code AND is
 * enforced independently by Firestore Rules for any client-side read. */
export async function getPublishedProjects(): Promise<Project[]> {
  const snap = await adminDb.collection("projects").where("status", "==", "published").get();
  return sortProjects(snap.docs.map(toProject));
}

/** Public: a single published project by slug, or null if it doesn't exist
 * or is still a draft — a draft must 404, not reveal that it exists. */
export async function getPublishedProjectBySlug(slug: string): Promise<Project | null> {
  const snap = await adminDb.collection("projects").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const project = toProject(doc);
  if (project.status !== "published") return null;
  return project;
}

/** Admin: every project regardless of status. */
export async function getAllProjectsAdmin(): Promise<Project[]> {
  const snap = await adminDb.collection("projects").get();
  return sortProjects(snap.docs.map(toProject));
}

export async function getProjectByIdAdmin(id: string): Promise<Project | null> {
  const snap = await adminDb.collection("projects").doc(id).get();
  if (!snap.exists) return null;
  return toProject(snap);
}

export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const snap = await adminDb.collection("projects").where("slug", "==", slug).limit(2).get();
  return snap.docs.some((d) => d.id !== excludeId);
}
