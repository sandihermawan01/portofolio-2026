"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { githubConfigSchema, type GithubConfigInput } from "@/lib/validations/github";
import { updateGithubConfigAction } from "@/features/github/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RepoListEditor } from "@/features/github/repo-list-editor";
import type { GithubConfig } from "@/types/github";

/**
 * Admin settings form for the GitHub Activity feature — the GitHub
 * username the contribution heatmap is drawn for, the "widgetVisible"
 * master switch for the public `/github` page, and the curated list of
 * repositories shown as "Currently Developing" (via RepoListEditor).
 *
 * Saving calls `updateGithubConfigAction`, which re-verifies every
 * selected repo against the live GitHub API server-side before persisting
 * — a repo that doesn't exist, is private, or is unreachable fails the
 * whole save with a specific error rather than being silently dropped.
 */
export function GithubConfigForm({ initialData }: { initialData: GithubConfig }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GithubConfigInput>({
    resolver: zodResolver(githubConfigSchema),
    defaultValues: {
      username: initialData.username ?? "",
      selectedRepos: initialData.selectedRepos ?? [],
      widgetVisible: initialData.widgetVisible ?? false,
    },
  });

  const onSubmit = async (values: GithubConfigInput) => {
    const result = await updateGithubConfigAction(values);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal menyimpan.");
      return;
    }
    toast.success("Pengaturan GitHub berhasil disimpan.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-8">
      <div className="space-y-2">
        <Label htmlFor="username">Username GitHub</Label>
        <Input id="username" placeholder="mis. zsans" {...register("username")} aria-invalid={!!errors.username} />
        <p className="text-xs text-muted-foreground">Akun yang dipakai untuk contribution heatmap.</p>
        {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="widgetVisible"
          render={({ field }) => <Switch id="widgetVisible" checked={field.value} onCheckedChange={field.onChange} />}
        />
        <Label htmlFor="widgetVisible">Tampilkan halaman GitHub Activity ke publik</Label>
      </div>

      <div className="space-y-2">
        <Label>Repository yang ditampilkan (&ldquo;Currently Developing&rdquo;)</Label>
        <Controller
          control={control}
          name="selectedRepos"
          render={({ field }) => <RepoListEditor value={field.value} onChange={field.onChange} />}
        />
        {errors.selectedRepos && <p className="text-sm text-destructive">{errors.selectedRepos.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
