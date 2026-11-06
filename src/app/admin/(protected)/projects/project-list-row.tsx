"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProjectAction, toggleProjectStatusAction } from "@/features/projects/actions";
import type { Project } from "@/types/content";

export function ProjectListRow({ project }: { project: Project }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleProjectStatusAction(project.id, checked ? "published" : "draft");
      if (!result.ok) {
        toast.error(result.error ?? "Gagal mengubah status.");
        return;
      }
      toast.success(checked ? "Project dipublikasikan." : "Project dijadikan draft.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-medium">{project.title}</h3>
          {project.featured && <Badge variant="solid">Featured</Badge>}
          <Badge variant={project.status === "published" ? "outline" : "default"}>{project.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">/project/{project.slug}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={project.status === "published"}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label={`Publikasikan ${project.title}`}
          />
          <span className="text-xs text-muted-foreground">Published</span>
        </div>
        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${project.title}`}>
          <Link href={`/admin/projects/${project.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <DeleteButton
          itemLabel={project.title}
          onConfirm={async () => {
            const result = await deleteProjectAction(project.id);
            router.refresh();
            return result;
          }}
        />
      </div>
    </div>
  );
}
