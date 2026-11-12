"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { nowSchema, type NowInput } from "@/lib/validations/now";
import { updateNowAction } from "@/features/now/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { NowContent } from "@/types/content";

export function NowForm({ initialData }: { initialData: NowContent | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NowInput>({
    resolver: zodResolver(nowSchema),
    defaultValues: {
      headline: initialData?.headline ?? "",
      body: initialData?.body ?? "",
    },
  });

  const onSubmit = async (values: NowInput) => {
    const result = await updateNowAction(values);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal menyimpan.");
      return;
    }
    toast.success("Halaman Now berhasil disimpan.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" {...register("headline")} aria-invalid={!!errors.headline} />
        {errors.headline && <p className="text-sm text-destructive">{errors.headline.message}</p>}
        <p className="text-xs text-muted-foreground">Contoh: &quot;Yang lagi saya kerjain sekarang&quot;</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Isi</Label>
        <Textarea id="body" rows={10} {...register("body")} aria-invalid={!!errors.body} />
        {errors.body && <p className="text-sm text-destructive">{errors.body.message}</p>}
        <p className="text-xs text-muted-foreground">Baris baru akan tetap tampil seperti aslinya di halaman publik.</p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
