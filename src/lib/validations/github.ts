import { z } from "zod";

/** GitHub username rules: 1–39 chars, alphanumeric or single hyphens, never
 * starting/ending with a hyphen. Matches GitHub's own constraint. */
export const githubUsernameSchema = z
  .string()
  .trim()
  .min(1, "Username GitHub wajib diisi")
  .max(39, "Username GitHub maksimal 39 karakter")
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, "Username GitHub tidak valid");

/** GitHub repo name rules: alphanumeric plus `.`, `-`, `_`. */
const githubRepoNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/, "Nama repository tidak valid");

export const repoStatusSchema = z.enum(["active", "planning", "paused", "completed"]);

export const repoSelectionSchema = z.object({
  owner: githubUsernameSchema,
  repo: githubRepoNameSchema,
  /** Admin's own label for what's happening with this repo right now —
   * GitHub has no such concept, so this never comes from the API. */
  status: repoStatusSchema,
  sortOrder: z.number().int().default(0),
});

export type RepoSelectionInput = z.infer<typeof repoSelectionSchema>;

export const githubConfigSchema = z.object({
  /** The GitHub account the contribution heatmap is drawn for. Independent
   * from `selectedRepos` below — the heatmap covers the whole account,
   * while selectedRepos is a hand-picked subset shown as "currently
   * developing" + source of the 3 latest commits. */
  username: githubUsernameSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  selectedRepos: z.array(repoSelectionSchema).max(12, "Maksimal 12 repository dipilih").default([]),
  /** Master on/off switch for the whole public /github page — lets the
   * admin hide the feature entirely (e.g. before it's configured) without
   * deleting the underlying config. */
  widgetVisible: z.boolean().default(false),
});

export type GithubConfigInput = z.infer<typeof githubConfigSchema>;
