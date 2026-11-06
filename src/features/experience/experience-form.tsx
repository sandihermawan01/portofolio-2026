"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { experienceSchema, type ExperienceInput, employmentTypeSchema } from "@/lib/validations/experience";
import { createExperienceAction, updateExperienceAction } from "@/features/experience/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TagInput } from "@/components/admin/tag-input";
import type { Experience } from "@/types/content";

const EMPLOYMENT_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Kontrak",
  freelance: "Freelance",
  internship: "Magang",
  volunteer: "Volunteer",
};

export function ExperienceForm({ initialData }: { initialData?: Experience }) {
  const router = useRouter();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      company: initialData?.company ?? "",
      employmentType: initialData?.employmentType ?? "full-time",
      location: initialData?.location ?? "",
      startDate: initialData?.startDate?.slice(0, 10) ?? "",
      endDate: initialData?.endDate?.slice(0, 10) ?? "",
      isCurrent: initialData?.isCurrent ?? false,
      description: initialData?.description ?? "",
      skills: initialData?.skills ?? [],
      sortOrder: initialData?.sortOrder ?? 0,
    },
  });

  const isCurrent = watch("isCurrent");

  const onSubmit = async (values: ExperienceInput) => {
    const result = isEdit
      ? await updateExperienceAction(initialData!.id, values)
      : await createExperienceAction(values);

    if (!result.ok) {
      toast.error(result.error ?? "Gagal menyimpan.");
      return;
    }
    toast.success(isEdit ? "Experience berhasil diperbarui." : "Experience berhasil ditambahkan.");
    router.push("/admin/experience");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Posisi / Jabatan</Label>
          <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Perusahaan / Organisasi</Label>
          <Input id="company" {...register("company")} aria-invalid={!!errors.company} />
          {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employmentType">Tipe pekerjaan</Label>
          <Controller
            control={control}
            name="employmentType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="employmentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypeSchema.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {EMPLOYMENT_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Lokasi (opsional)</Label>
          <Input id="location" {...register("location")} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Tanggal mulai</Label>
          <Input id="startDate" type="date" {...register("startDate")} aria-invalid={!!errors.startDate} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Tanggal selesai</Label>
          <Input id="endDate" type="date" disabled={isCurrent} {...register("endDate")} aria-invalid={!!errors.endDate} />
          {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="isCurrent"
          render={({ field }) => <Switch id="isCurrent" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="isCurrent">Masih berlangsung saat ini</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi & pencapaian</Label>
        <Textarea id="description" rows={6} {...register("description")} aria-invalid={!!errors.description} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Teknologi / skill terkait (opsional)</Label>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} ariaLabel="Tambah skill" placeholder="Ketik skill lalu Enter" />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Urutan tampilan (angka lebih kecil tampil lebih dulu bila tanggal sama)</Label>
        <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} className="max-w-32" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Experience"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/experience")}>
          Batal
        </Button>
      </div>
    </form>
  );
}
