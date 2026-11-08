"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, UnauthorizedError } from "@/lib/firebase/auth";
import { githubConfigSchema } from "@/lib/validations/github";
import { fetchRepoMetadata, GithubApiError } from "@/lib/github/client";
import { syncGithubActivity } from "@/lib/github/sync";
import { isGithubIntegrationConfigured } from "@/config/env";
import { GITHUB_CONFIG_DOC_REF_PATH } from "./queries";
import type { ActionResult } from "@/features/about/actions";
import type { SyncResult } from "@/types/github";

/**
 * Admin Server Actions for the GitHub Activity feature. Every one of these
 * calls `requireAdmin()` first, independently of the `/admin/github` page's
 * own layout-level auth check — same pattern as every other admin feature
 * in this app (see src/lib/firebase/auth.ts for why that's not redundant).
 */

export async function updateGithubConfigAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const parsed = githubConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Reject a repo the admin just added if it doesn't actually exist, isn't
  // reachable, or is private — fail the whole save rather than silently
  // dropping the bad entry, so the admin gets a clear error pointing at
  // which repo is the problem instead of a config that quietly omits it.
  if (!isGithubIntegrationConfigured()) {
    if (parsed.data.selectedRepos.length > 0) {
      return {
        ok: false,
        error: "GITHUB_TOKEN belum diset di server — tidak bisa memvalidasi repository yang dipilih.",
      };
    }
  } else {
    for (const sel of parsed.data.selectedRepos) {
      try {
        await fetchRepoMetadata(sel.owner, sel.repo);
      } catch (e) {
        const detail = e instanceof GithubApiError ? e.message : "gagal diverifikasi";
        return { ok: false, error: `Repository ${sel.owner}/${sel.repo}: ${detail}` };
      }
    }
  }

  await adminDb.doc(GITHUB_CONFIG_DOC_REF_PATH).set(
    { ...parsed.data, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  revalidatePath("/admin/github");
  revalidatePath("/github");
  revalidatePath("/project");
  return { ok: true };
}

export async function syncGithubActivityAction(): Promise<ActionResult<SyncResult>> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Tidak diizinkan." };
    throw e;
  }

  const result = await syncGithubActivity();

  revalidatePath("/admin/github");
  revalidatePath("/github");
  revalidatePath("/project");

  if (!result.ok) {
    // Still "succeeds" as an action (sync ran, cache was updated/preserved
    // per-section) — surface the per-section errors as a soft warning
    // rather than a hard failure, since partial sync is the whole point of
    // the fallback design in lib/github/sync.ts.
    return { ok: true, data: result, error: result.errors.join("; ") };
  }

  return { ok: true, data: result };
}
