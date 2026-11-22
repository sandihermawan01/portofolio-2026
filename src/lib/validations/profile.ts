import { z } from "zod";
import { optionalHttpsUrlSchema, socialLinkSchema } from "./common";
import { SKILL_LEVELS } from "@/lib/skills";

const skillSchema = z.object({
  name: z.string().trim().min(1).max(40),
  level: z.enum(SKILL_LEVELS),
});

const statSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(24),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  role: z.string().trim().min(1, "Role wajib diisi").max(120),
  bio: z.string().trim().min(1, "Bio wajib diisi").max(2000),
  location: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  avatarUrl: optionalHttpsUrlSchema,
  skills: z.array(skillSchema).max(40).default([]),
  facts: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  stats: z.array(statSchema).max(6).default([]),
  socialLinks: z.array(socialLinkSchema).max(12).default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type StatInput = z.infer<typeof statSchema>;

export const contactInfoSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  location: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  socialLinks: z.array(socialLinkSchema).max(12).default([]),
});

export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
