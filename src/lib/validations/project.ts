import { z } from "zod";
import { httpsUrlSchema, optionalHttpsUrlSchema, slugSchema } from "./common";

export const projectStatusSchema = z.enum(["draft", "published"]);

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Nama proyek wajib diisi").max(120),
  slug: slugSchema,
  summary: z.string().trim().min(1, "Deskripsi singkat wajib diisi").max(200),
  description: z.string().trim().min(1, "Deskripsi lengkap wajib diisi").max(8000),
  coverImageUrl: optionalHttpsUrlSchema,
  gallery: z.array(httpsUrlSchema).max(20).default([]),
  technologies: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  liveUrl: optionalHttpsUrlSchema,
  repositoryUrl: optionalHttpsUrlSchema,
  featured: z.boolean().default(false),
  status: projectStatusSchema.default("draft"),
  sortOrder: z.number().int().default(0),
});

export type ProjectInput = z.infer<typeof projectSchema>;
