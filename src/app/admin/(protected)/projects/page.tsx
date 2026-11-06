import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getAllProjectsAdmin } from "@/features/projects/queries";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ProjectListRow } from "./project-list-row";

export const metadata: Metadata = { title: "Projects — Admin" };

export default async function AdminProjectsListPage() {
  const projects = await getAllProjectsAdmin();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="index-label mb-2">ADMIN / PROJECTS</p>
          <h1 className="font-display text-3xl font-semibold">Kelola Project</h1>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4" /> Tambah
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="Belum ada project" description="Tambahkan proyek pertama Anda." />
      ) : (
        <div className="divide-y divide-border border border-border">
          {projects.map((project) => (
            <ProjectListRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
