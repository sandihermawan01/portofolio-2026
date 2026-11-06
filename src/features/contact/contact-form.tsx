"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactFormSchema, type ContactFormInput } from "@/lib/validations/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", message: "", website: "" },
  });

  const onSubmit = async (values: ContactFormInput) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        toast.error(result.error ?? "Gagal mengirim pesan. Coba lagi.");
        return;
      }

      toast.success("Pesan terkirim. Terima kasih!");
      reset();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Coba lagi.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-5">
      {/* Honeypot field — hidden from real visitors via CSS, not `type=hidden`,
          since some bots skip hidden inputs but still fill visually-hidden ones. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Pesan</Label>
        <Textarea id="message" rows={6} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} {...register("message")} />
        {errors.message && (
          <p id="message-error" className="text-sm text-destructive">
            {errors.message.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Mengirim…" : "Kirim Pesan"}
      </Button>
    </form>
  );
}
