import type { Metadata } from "next";
import { getProfile } from "@/features/about/queries";
import { ProfileForm } from "@/features/about/profile-form";

export const metadata: Metadata = { title: "About — Admin" };

export default async function AdminAboutPage() {
  const profile = await getProfile();

  return (
    <div>
      <p className="index-label mb-2">ADMIN / ABOUT</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Kelola About</h1>
      <ProfileForm initialData={profile} />
    </div>
  );
}
