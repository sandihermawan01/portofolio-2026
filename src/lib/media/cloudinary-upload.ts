import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { getServerEnv } from "@/config/env";

/**
 * Image upload/delete via Cloudinary's REST API, replacing Firebase Storage.
 *
 * WHY: Firebase Storage requires the project's "Blaze" (pay-as-you-go)
 * billing plan to even create a bucket — not worth it for a personal
 * portfolio with a handful of images. Cloudinary's free tier (no card
 * required) covers this comfortably (25 monthly credits ≈ 25GB of storage
 * or bandwidth) and needs no extra npm package: just `fetch` + Node's
 * built-in `crypto`, both already available in Node ≥ 18.
 *
 * Security model is unchanged from the Storage version:
 *  - The API secret never reaches the browser — only this server module
 *    talks to Cloudinary, using a SIGNED upload (HMAC-less SHA-1 signature
 *    per Cloudinary's spec). The client only ever calls our own Server
 *    Action (`uploadProjectImageAction`/`uploadAvatarAction`), which
 *    independently calls `requireAdmin()` before this function ever runs.
 *  - MIME type is validated from the actual file AND by sniffing magic
 *    bytes, not trusted from the filename/extension.
 *  - The stored object's public_id is a fresh random UUID under a fixed
 *    folder (`avatars/` or `projects/`) — never the user-supplied filename
 *    — so there's no path traversal and no way to smuggle an unexpected
 *    extension through.
 *  - SVG is deliberately excluded: it can embed `<script>` and is a common
 *    stored-XSS vector when later rendered as an "image".
 */

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export class InvalidUploadError extends Error {}

function cloudinaryConfig() {
  const env = getServerEnv();
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

/** Cloudinary's signing scheme: sha1("key1=val1&key2=val2..." + api_secret),
 * params sorted alphabetically by key, excluding file/cloud_name/api_key/
 * resource_type/signature itself. See
 * https://cloudinary.com/documentation/signatures */
function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(sorted + apiSecret).digest("hex");
}

export async function uploadImage(file: File, folder: "avatars" | "projects"): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new InvalidUploadError(`Tipe file tidak didukung: ${file.type || "tidak diketahui"}`);
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new InvalidUploadError("Ukuran file harus di bawah 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesMagicBytes(buffer, file.type)) {
    throw new InvalidUploadError("Isi file tidak sesuai dengan tipe yang dilaporkan");
  }

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${folder}/${randomUUID()}`;
  const signature = signParams({ folder, public_id: publicId, timestamp }, apiSecret);

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: file.type }));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    // Cloudinary's error body may contain account details — log server-side
    // only, never forward verbatim to the client.
    const body = await res.text().catch(() => "");
    console.error("Cloudinary upload failed", res.status, body.slice(0, 500));
    throw new Error("Upload ke penyimpanan gambar gagal. Coba lagi.");
  }

  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) {
    throw new Error("Upload berhasil tapi tidak mendapat URL dari penyedia gambar.");
  }

  return json.secure_url;
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const publicId = extractPublicId(url);
  if (!publicId) return; // not a Cloudinary URL we recognize — don't touch it

  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp }, apiSecret);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  // Best-effort cleanup: a transient failure here should never block the
  // caller's own action (e.g. replacing an avatar) from completing.
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      console.error("Cloudinary delete failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Cloudinary delete request failed", err);
  }
}

/** Extracts the public_id (folder/uuid, no extension, no version segment)
 * from a Cloudinary delivery URL, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v169.../projects/<uuid>.jpg
 * → "projects/<uuid>" */
function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match?.[1] ?? null;
}

function matchesMagicBytes(buffer: Buffer, mime: string): boolean {
  const bytes = buffer.subarray(0, 12);
  switch (mime) {
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/webp":
      return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    case "image/avif":
      return bytes.subarray(4, 8).toString("ascii") === "ftyp";
    default:
      return false;
  }
}
