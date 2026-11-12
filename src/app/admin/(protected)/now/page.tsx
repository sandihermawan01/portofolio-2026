import type { Metadata } from "next";
import { getNowContent } from "@/features/now/queries";
import { NowForm } from "@/features/now/now-form";

export const metadata: Metadata = { title: "Now — Admin" };

export default async function AdminNowPage() {
  const now = await getNowContent();

  return (
    <div>
      <p className="index-label mb-2">ADMIN / NOW</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Kelola Halaman Now</h1>
      <NowForm initialData={now} />
    </div>
  );
}
