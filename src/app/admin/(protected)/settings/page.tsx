import type { Metadata } from "next";
import { getContactInfo } from "@/features/about/queries";
import { ContactSettingsForm } from "@/features/about/contact-settings-form";

export const metadata: Metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const contactInfo = await getContactInfo();

  return (
    <div>
      <p className="index-label mb-2">ADMIN / SETTINGS</p>
      <h1 className="mb-8 font-display text-3xl font-semibold">Pengaturan Contact</h1>
      <ContactSettingsForm initialData={contactInfo} />
    </div>
  );
}
