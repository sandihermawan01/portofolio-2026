"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { deleteImageByUrl } from "@/lib/media/cloudinary-upload";
import { findUnusedImages, type UnusedImage } from "./queries";
import { PROFILE_DOC_REF_PATH } from "@/features/about/queries";
import type { ActionResult } from "@/features/about/actions";

export async function getUnusedImagesAction(): Promise<ActionResult<UnusedImage[]>> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  try {
    const images = await findUnusedImages();
    return { ok: true, data: images };
  } catch (e) {
    console.error("findUnusedImages failed", e);
    return { ok: false, error: e instanceof Error ? e.message : "Gagal memeriksa gambar yang tidak terpakai." };
  }
}

export async function deleteUnusedImagesAction(urls: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  if (urls.length === 0) return { ok: true };

  await Promise.all(urls.map((url) => deleteImageByUrl(url)));

  revalidatePath("/admin/cleanup");
  return { ok: true };
}

/**
 * One-off tidy-up: the "fun facts" feature (facts[] + factsImageUrl) was
 * replaced by the "My Skills" bar chart, and the old fields were dropped
 * from the schema — but a profile doc saved before that change may still
 * carry them in Firestore. They're already ignored on read, this just
 * removes the dead weight from the stored document itself.
 */
export async function cleanupLegacyProfileFieldsAction(): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  try {
    await adminDb.doc(PROFILE_DOC_REF_PATH).update({
      facts: FieldValue.delete(),
      factsImageUrl: FieldValue.delete(),
    });
  } catch (e) {
    // No profile doc yet (fresh install) — nothing to clean up.
    console.error("cleanupLegacyProfileFieldsAction update failed", e);
  }

  revalidatePath("/admin/cleanup");
  revalidatePath("/about");
  return { ok: true };
}
