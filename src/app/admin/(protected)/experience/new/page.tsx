import type { Metadata } from "next";
import { ExperienceForm } from "@/features/experience/experience-form";

export const metadata: Metadata = { title: "Tambah Experience — Admin" };

export default function NewExperiencePage() {
  return (
    <div>
      <p className="index-label mb-2">ADMIN / EXPERIENCE / BARU</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Tambah Experience</h1>
      <ExperienceForm />
    </div>
  );
}
