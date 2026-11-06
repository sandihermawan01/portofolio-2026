"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { projectSchema } from "@/lib/validations/project";
import { isSlugTaken } from "./queries";
import type { ActionResult } from "@/features/about/actions";

const COLLECTION = "projects";

function revalidateProjectPaths(slug?: string) {
  revalidatePath("/project");
  revalidatePath("/");
  if (slug) revalidatePath(`/project/${slug}`);
}

export async function createProjectAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (await isSlugTaken(parsed.data.slug)) {
    return { ok: false, error: "Slug sudah digunakan.", fieldErrors: { slug: ["Slug sudah digunakan"] } };
  }

  const ref = await adminDb.collection(COLLECTION).add({
    ...parsed.data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidateProjectPaths(parsed.data.slug);
  return { ok: true, data: { id: ref.id } };
}

export async function updateProjectAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ref = adminDb.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) {
    return { ok: false, error: "Proyek tidak ditemukan." };
  }

  if (await isSlugTaken(parsed.data.slug, id)) {
    return { ok: false, error: "Slug sudah digunakan.", fieldErrors: { slug: ["Slug sudah digunakan"] } };
  }

  const previousSlug = existing.data()?.slug as string | undefined;
  await ref.set({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  revalidateProjectPaths(previousSlug);
  revalidateProjectPaths(parsed.data.slug);
  return { ok: true };
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const ref = adminDb.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  const slug = existing.data()?.slug as string | undefined;

  await ref.delete();

  revalidateProjectPaths(slug);
  return { ok: true };
}

export async function toggleProjectStatusAction(id: string, status: "draft" | "published"): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const ref = adminDb.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return { ok: false, error: "Proyek tidak ditemukan." };

  await ref.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  revalidateProjectPaths(existing.data()?.slug as string | undefined);
  return { ok: true };
}
