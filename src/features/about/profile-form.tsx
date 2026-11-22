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
import { SkillLevelEditor } from "@/components/admin/skill-level-editor";
import { StatsEditor } from "@/components/admin/stats-editor";
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
      facts: initialData?.facts ?? [],
      stats: initialData?.stats ?? [],
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

  const onInvalid = (invalidErrors: typeof errors) => {
    // Surfaces the "nothing happens on submit" case: validation blocked it silently.
    console.error("Profile form validation failed:", invalidErrors);
    toast.error("Ada input yang belum valid — cek pesan error di tiap field.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="max-w-2xl space-y-6">
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
        <Label>Tech stack</Label>
        <p className="text-xs text-muted-foreground">
          Pilih level tiap tech stack — persentase di halaman About dihitung otomatis dari level ini.
        </p>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => <SkillLevelEditor value={field.value} onChange={field.onChange} />}
        />
        {errors.skills && <p className="text-sm text-destructive">{String(errors.skills.message ?? "Skill ada yang tidak valid.")}</p>}
      </div>

      <div className="space-y-2">
        <Label>Stat ringkas (opsional)</Label>
        <p className="text-xs text-muted-foreground">Contoh: &quot;20+&quot; / &quot;Project selesai&quot;.</p>
        <Controller
          control={control}
          name="stats"
          render={({ field }) => <StatsEditor value={field.value} onChange={field.onChange} />}
        />
        {errors.stats && <p className="text-sm text-destructive">{String(errors.stats.message ?? "Stat ada yang tidak valid.")}</p>}
      </div>

      <div className="space-y-2">
        <Label>Fun facts (opsional)</Label>
        <p className="text-xs text-muted-foreground">
          Maks. 160 karakter per fakta. Kalau teksnya panjang, pecah jadi beberapa kalimat pendek dan tekan Enter satu per satu.
        </p>
        <Controller
          control={control}
          name="facts"
          render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} ariaLabel="Tambah fun fact" placeholder="Ketik fakta lalu Enter" />
          )}
        />
        {errors.facts && (
          <p className="text-sm text-destructive">
            {String(errors.facts.message ?? "Ada fakta yang kepanjangan (maks. 160 karakter) — coba pecah jadi beberapa kalimat lalu Enter satu per satu.")}
          </p>
        )}
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
