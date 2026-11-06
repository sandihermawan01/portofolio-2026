import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExperienceById } from "@/features/experience/queries";
import { ExperienceForm } from "@/features/experience/experience-form";

export const metadata: Metadata = { title: "Edit Experience — Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExperiencePage({ params }: Props) {
  const { id } = await params;
  const experience = await getExperienceById(id);

  if (!experience) notFound();

  return (
    <div>
      <p className="index-label mb-2">ADMIN / EXPERIENCE / EDIT</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Edit Experience</h1>
      <ExperienceForm initialData={experience} />
    </div>
  );
}
