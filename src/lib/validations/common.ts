import { z } from "zod";

/** Only http/https URLs are accepted anywhere in admin-authored content,
 * to stop `javascript:`/`data:` URL injection via link fields. */
export const httpsUrlSchema = z
  .string()
  .trim()
  .url("URL tidak valid")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, "URL harus menggunakan protokol http atau https");

export const optionalHttpsUrlSchema = z
  .union([httpsUrlSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug minimal 2 karakter")
  .max(80, "Slug maksimal 80 karakter")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda strip");

export const socialLinkSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, "Label wajib diisi").max(40),
  url: httpsUrlSchema,
});

export type SocialLink = z.infer<typeof socialLinkSchema>;
