import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getExperiences } from "@/features/experience/queries";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ExperienceListRow } from "./experience-list-row";

export const metadata: Metadata = { title: "Experience — Admin" };

export default async function AdminExperienceListPage() {
  const experiences = await getExperiences();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="index-label mb-2">ADMIN / EXPERIENCE</p>
          <h1 className="font-display text-3xl font-semibold">Kelola Experience</h1>
        </div>
        <Button asChild>
          <Link href="/admin/experience/new">
            <Plus className="h-4 w-4" /> Tambah
          </Link>
        </Button>
      </div>

      {experiences.length === 0 ? (
        <EmptyState title="Belum ada experience" description="Tambahkan riwayat pengalaman pertama Anda." />
      ) : (
        <div className="divide-y divide-border border border-border">
          {experiences.map((exp) => (
            <ExperienceListRow key={exp.id} experience={exp} />
          ))}
        </div>
      )}
    </div>
  );
}
