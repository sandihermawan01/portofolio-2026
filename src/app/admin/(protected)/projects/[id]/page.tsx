import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectByIdAdmin } from "@/features/projects/queries";
import { ProjectForm } from "@/features/projects/project-form";

export const metadata: Metadata = { title: "Edit Project — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectByIdAdmin(id);

  if (!project) notFound();

  return (
    <div>
      <p className="index-label mb-2">ADMIN / PROJECTS / EDIT</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Edit Project</h1>
      <ProjectForm initialData={project} />
    </div>
  );
}
