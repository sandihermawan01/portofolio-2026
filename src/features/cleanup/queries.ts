import "server-only";

import { listCloudinaryResources, type CloudinaryResource } from "@/lib/media/cloudinary-upload";
import { getProfile } from "@/features/about/queries";
import { getAllProjectsAdmin } from "@/features/projects/queries";

export interface UnusedImage extends CloudinaryResource {
  folder: "avatars" | "projects";
}

/**
 * Cross-checks every image actually sitting in Cloudinary against every URL
 * still referenced from Firestore (profile avatar, project cover + gallery)
 * and returns the ones nothing points to anymore — leftovers from replaced
 * images, abandoned drafts, etc.
 *
 * This is admin-only data (it reveals storage usage), but the gating itself
 * is the caller's job — same pattern as `getAllProjectsAdmin`: this function
 * does no `requireAdmin()` check of its own, the Server Action that calls it
 * does.
 */
export async function findUnusedImages(): Promise<UnusedImage[]> {
  const [profile, projects, avatarResources, projectResources] = await Promise.all([
    getProfile(),
    getAllProjectsAdmin(),
    listCloudinaryResources("avatars"),
    listCloudinaryResources("projects"),
  ]);

  const used = new Set<string>();
  if (profile?.avatarUrl) used.add(profile.avatarUrl);
  for (const project of projects) {
    if (project.coverImageUrl) used.add(project.coverImageUrl);
    for (const img of project.gallery) used.add(img);
  }

  const unused: UnusedImage[] = [];
  for (const r of avatarResources) if (!used.has(r.url)) unused.push({ ...r, folder: "avatars" });
  for (const r of projectResources) if (!used.has(r.url)) unused.push({ ...r, folder: "projects" });

  // Newest first — a freshly-uploaded-then-abandoned image is the most
  // likely candidate (e.g. the admin picked a new file but never saved).
  return unused.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
