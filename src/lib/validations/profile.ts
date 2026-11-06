import { z } from "zod";
import { optionalHttpsUrlSchema, socialLinkSchema } from "./common";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  role: z.string().trim().min(1, "Role wajib diisi").max(120),
  bio: z.string().trim().min(1, "Bio wajib diisi").max(2000),
  location: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  avatarUrl: optionalHttpsUrlSchema,
  skills: z.array(z.string().trim().min(1).max(40)).max(40).default([]),
  socialLinks: z.array(socialLinkSchema).max(12).default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const contactInfoSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  location: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  socialLinks: z.array(socialLinkSchema).max(12).default([]),
});

export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
