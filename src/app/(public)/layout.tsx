import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getProfile, getContactInfo } from "@/features/about/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [profile, contact] = await Promise.all([getProfile(), getContactInfo()]);
  const ownerName = profile?.name ?? "";
  const socialLinks = contact?.socialLinks ?? profile?.socialLinks ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar ownerName={ownerName} />
      <main className="flex-1">{children}</main>
      <Footer ownerName={ownerName} socialLinks={socialLinks} />
    </div>
  );
}
