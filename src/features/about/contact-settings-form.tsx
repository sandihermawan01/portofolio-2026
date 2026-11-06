"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactInfoSchema, type ContactInfoInput } from "@/lib/validations/profile";
import { updateContactInfoAction } from "@/features/about/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLinksEditor } from "@/components/admin/social-links-editor";
import type { ContactInfo } from "@/types/content";

export function ContactSettingsForm({ initialData }: { initialData: ContactInfo | null }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactInfoInput>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: initialData?.email ?? "",
      location: initialData?.location ?? "",
      socialLinks: initialData?.socialLinks ?? [],
    },
  });

  const onSubmit = async (values: ContactInfoInput) => {
    const result = await updateContactInfoAction(values);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal menyimpan.");
      return;
    }
    toast.success("Pengaturan contact berhasil disimpan.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email kontak publik</Label>
        <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi (opsional)</Label>
        <Input id="location" {...register("location")} />
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
