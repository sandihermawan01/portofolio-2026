import type { Metadata } from "next";
import { ProjectForm } from "@/features/projects/project-form";

export const metadata: Metadata = { title: "Tambah Project — Admin" };

export default function NewProjectPage() {
  return (
    <div>
      <p className="index-label mb-2">ADMIN / PROJECTS / BARU</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Tambah Project</h1>
      <ProjectForm />
    </div>
  );
}
