"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { updateProfileAction } from "@/features/about/actions";
import { uploadAvatarAction, deleteImageAction } from "@/features/projects/media-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/admin/tag-input";
import { SocialLinksEditor } from "@/components/admin/social-links-editor";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { Profile } from "@/types/content";

export function ProfileForm({ initialData }: { initialData: Profile | null }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      role: initialData?.role ?? "",
      bio: initialData?.bio ?? "",
      location: initialData?.location ?? "",
      avatarUrl: initialData?.avatarUrl,
      skills: initialData?.skills ?? [],
      socialLinks: initialData?.socialLinks ?? [],
    },
  });

  const previousAvatarUrl = React.useRef(initialData?.avatarUrl);

  const onSubmit = async (values: ProfileInput) => {
    const result = await updateProfileAction(values);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal menyimpan.");
      return;
    }
    // Clean up the previous avatar from Storage if it was replaced.
    if (previousAvatarUrl.current && previousAvatarUrl.current !== values.avatarUrl) {
      void deleteImageAction(previousAvatarUrl.current);
    }
    previousAvatarUrl.current = values.avatarUrl;
    toast.success("Profil berhasil disimpan.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-6">
      <Controller
        control={control}
        name="avatarUrl"
        render={({ field }) => (
          <ImageUploadField label="Foto Profil (opsional)" value={field.value} onChange={field.onChange} uploadAction={uploadAvatarAction} />
        )}
      />

      <div className="space-y-2">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role / Profesi</Label>
        <Input id="role" {...register("role")} aria-invalid={!!errors.role} />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={5} {...register("bio")} aria-invalid={!!errors.bio} />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi (opsional)</Label>
        <Input id="location" {...register("location")} />
      </div>

      <div className="space-y-2">
        <Label>Skill</Label>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} ariaLabel="Tambah skill" placeholder="Ketik skill lalu Enter" />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Social links</Label>
        <Controller
          control={control}
          name="socialLinks"
          render={({ field }) => <SocialLinksEditor value={field.value} onChange={field.onChange} />}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
