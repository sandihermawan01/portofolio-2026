"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { profileSchema, contactInfoSchema } from "@/lib/validations/profile";
import { PROFILE_DOC_REF_PATH, CONTACT_DOC_REF_PATH } from "./queries";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await adminDb.doc(PROFILE_DOC_REF_PATH).set(
    { ...parsed.data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  revalidatePath("/");
  revalidatePath("/about");
  return { ok: true };
}

export async function updateContactInfoAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = contactInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await adminDb.doc(CONTACT_DOC_REF_PATH).set(
    { ...parsed.data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  revalidatePath("/contact");
  return { ok: true };
}
