import { z } from "zod";

export const employmentTypeSchema = z.enum([
  "full-time",
  "part-time",
  "contract",
  "freelance",
  "internship",
  "volunteer",
]);

export const experienceSchema = z
  .object({
    title: z.string().trim().min(1, "Posisi wajib diisi").max(120),
    company: z.string().trim().min(1, "Perusahaan wajib diisi").max(120),
    employmentType: employmentTypeSchema,
    location: z.string().trim().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
    startDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal mulai tidak valid"),
    endDate: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal selesai tidak valid")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().min(1, "Deskripsi wajib diisi").max(4000),
    skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    sortOrder: z.number().int().default(0),
  })
  .superRefine((val, ctx) => {
    if (!val.isCurrent && !val.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Isi tanggal selesai, atau tandai sebagai 'masih berlangsung'",
      });
    }
    if (val.isCurrent && val.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Kosongkan tanggal selesai jika masih berlangsung",
      });
    }
    if (val.endDate && new Date(val.endDate) < new Date(val.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      });
    }
  });

export type ExperienceInput = z.infer<typeof experienceSchema>;
