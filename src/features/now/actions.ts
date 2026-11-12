"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { nowSchema } from "@/lib/validations/now";
import type { ActionResult } from "@/features/about/actions";
import { NOW_DOC_REF_PATH } from "./queries";

export async function updateNowAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = nowSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await adminDb.doc(NOW_DOC_REF_PATH).set(
    { ...parsed.data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  revalidatePath("/now");
  return { ok: true };
}
