"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import { projectSchema, type ProjectInput } from "@/lib/validations/project";
import { createProjectAction, updateProjectAction } from "@/features/projects/actions";
import { uploadProjectImageAction, deleteImageAction } from "@/features/projects/media-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TagInput } from "@/components/admin/tag-input";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { slugify } from "@/lib/utils";
import type { Project } from "@/types/content";

export function ProjectForm({ initialData }: { initialData?: Project }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const slugManuallyEdited = React.useRef(isEdit);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      summary: initialData?.summary ?? "",
      description: initialData?.description ?? "",
      coverImageUrl: initialData?.coverImageUrl,
      gallery: initialData?.gallery ?? [],
      technologies: initialData?.technologies ?? [],
      liveUrl: initialData?.liveUrl ?? "",
      repositoryUrl: initialData?.repositoryUrl ?? "",
      featured: initialData?.featured ?? false,
      status: initialData?.status ?? "draft",
      sortOrder: initialData?.sortOrder ?? 0,
    },
  });

  const title = watch("title");

  React.useEffect(() => {
    if (!slugManuallyEdited.current) {
      setValue("slug", slugify(title || ""), { shouldValidate: false });
    }
  }, [title, setValue]);

  const onSubmit = async (values: ProjectInput) => {
    const result = isEdit ? await updateProjectAction(initialData!.id, values) : await createProjectAction(values);

    if (!result.ok) {
      toast.error(result.error ?? "Gagal menyimpan.");
      return;
    }
    toast.success(isEdit ? "Project berhasil diperbarui." : "Project berhasil ditambahkan.");
    router.push("/admin/projects");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Nama proyek</Label>
        <Input id="title" {...register("title")} aria-invalid={!!errors.title} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL unik)</Label>
        <Input
          id="slug"
          {...register("slug")}
          onChange={(e) => {
            slugManuallyEdited.current = true;
            setValue("slug", e.target.value);
          }}
          aria-invalid={!!errors.slug}
        />
        <p className="text-xs text-muted-foreground">Akan tampil sebagai /project/{watch("slug") || "slug-anda"}</p>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Deskripsi singkat</Label>
        <Textarea id="summary" rows={2} {...register("summary")} aria-invalid={!!errors.summary} />
        {errors.summary && <p className="text-sm text-destructive">{errors.summary.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi lengkap</Label>
        <Textarea id="description" rows={8} {...register("description")} aria-invalid={!!errors.description} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <Controller
        control={control}
        name="coverImageUrl"
        render={({ field }) => (
          <ImageUploadField label="Cover image" value={field.value} onChange={field.onChange} uploadAction={uploadProjectImageAction} />
        )}
      />

      <Controller control={control} name="gallery" render={({ field }) => <GalleryEditor value={field.value} onChange={field.onChange} />} />

      <div className="space-y-2">
        <Label>Tech stack</Label>
        <Controller
          control={control}
          name="technologies"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} ariaLabel="Tambah teknologi" placeholder="Ketik teknologi lalu Enter" />
          )}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="liveUrl">Live demo URL (opsional)</Label>
          <Input id="liveUrl" {...register("liveUrl")} aria-invalid={!!errors.liveUrl} />
          {errors.liveUrl && <p className="text-sm text-destructive">{errors.liveUrl.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="repositoryUrl">Repository URL (opsional)</Label>
          <Input id="repositoryUrl" {...register("repositoryUrl")} aria-invalid={!!errors.repositoryUrl} />
          {errors.repositoryUrl && <p className="text-sm text-destructive">{errors.repositoryUrl.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status publikasi</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Urutan tampilan</Label>
          <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="featured"
          render={({ field }) => <Switch id="featured" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="featured">Featured / pinned</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Project"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/projects")}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function GalleryEditor({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  async function handleUploaded(formData: FormData) {
    const result = await uploadProjectImageAction(formData);
    if (result.ok && result.data) {
      onChange([...value, result.data.url]);
    }
    return result;
  }

  async function remove(url: string) {
    onChange(value.filter((u) => u !== url));
    void deleteImageAction(url);
  }

  return (
    <div>
      <Label>Gallery (opsional)</Label>
      <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-sm border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- small admin-only thumbnail grid; next/image overhead isn't worth it here */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label="Hapus gambar"
              className="absolute right-1 top-1 rounded-sm bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <ImageUploadField label="" value={undefined} onChange={() => {}} uploadAction={handleUploaded} />
      </div>
    </div>
  );
}
