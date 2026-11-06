"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteExperienceAction } from "@/features/experience/actions";
import { formatMonthYear } from "@/lib/utils";
import type { Experience } from "@/types/content";

export function ExperienceListRow({ experience }: { experience: Experience }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-medium">{experience.title}</h3>
          {experience.isCurrent && <Badge variant="solid">Current</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {experience.company} · {formatMonthYear(experience.startDate)} —{" "}
          {experience.isCurrent ? "Sekarang" : experience.endDate ? formatMonthYear(experience.endDate) : "-"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${experience.title}`}>
          <Link href={`/admin/experience/${experience.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <DeleteButton
          itemLabel={experience.title}
          onConfirm={async () => {
            const result = await deleteExperienceAction(experience.id);
            router.refresh();
            return result;
          }}
        />
      </div>
    </div>
  );
}
