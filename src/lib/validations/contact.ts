import { z } from "zod";

/**
 * Contact form schema, used identically on client (instant feedback) and
 * server (the only validation that actually matters). `website` is a
 * honeypot field: rendered visually hidden in the form; any real browser
 * leaves it empty, so a non-empty value is a strong bot signal.
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().trim().email("Email tidak valid").max(200),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(3000, "Pesan maksimal 3000 karakter"),
  website: z.string().max(0, "Permintaan ditolak").optional().or(z.literal("")),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
