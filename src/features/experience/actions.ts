"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { experienceSchema } from "@/lib/validations/experience";
import type { ActionResult } from "@/features/about/actions";

const COLLECTION = "experiences";

export async function createExperienceAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ref = await adminDb.collection(COLLECTION).add({
    ...parsed.data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/experience");
  revalidatePath("/");
  return { ok: true, data: { id: ref.id } };
}

export async function updateExperienceAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ref = adminDb.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) {
    return { ok: false, error: "Data tidak ditemukan." };
  }

  await ref.set({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  revalidatePath("/experience");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteExperienceAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  await adminDb.collection(COLLECTION).doc(id).delete();

  revalidatePath("/experience");
  revalidatePath("/");
  return { ok: true };
}
