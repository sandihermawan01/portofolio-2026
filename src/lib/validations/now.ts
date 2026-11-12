import { z } from "zod";

export const nowSchema = z.object({
  headline: z.string().trim().min(1, "Headline wajib diisi").max(160),
  body: z.string().trim().min(1, "Isi wajib diisi").max(4000),
});

export type NowInput = z.infer<typeof nowSchema>;
