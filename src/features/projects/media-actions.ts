"use server";

import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { uploadImage, deleteImageByUrl, InvalidUploadError } from "@/lib/media/cloudinary-upload";
import type { ActionResult } from "@/features/about/actions";

export async function uploadProjectImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "File tidak ditemukan." };
  }

  try {
    const url = await uploadImage(file, "projects");
    return { ok: true, data: { url } };
  } catch (e) {
    if (e instanceof InvalidUploadError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "File tidak ditemukan." };
  }

  try {
    const url = await uploadImage(file, "avatars");
    return { ok: true, data: { url } };
  } catch (e) {
    if (e instanceof InvalidUploadError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function deleteImageAction(url: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  await deleteImageByUrl(url);
  return { ok: true };
}
