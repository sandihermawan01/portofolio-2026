import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { NextPageLink } from "@/components/layout/next-page-link";
import { ViewTransitionsProvider } from "@/components/layout/view-transitions-provider";
import { getProfile, getContactInfo } from "@/features/about/queries";
import { getGithubConfig } from "@/features/github/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [profile, contact, githubConfig] = await Promise.all([getProfile(), getContactInfo(), getGithubConfig()]);
  const ownerName = profile?.name ?? "";
  const socialLinks = contact?.socialLinks ?? profile?.socialLinks ?? [];

  return (
    <ViewTransitionsProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar ownerName={ownerName} showGithubLink={githubConfig.widgetVisible} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
          <NextPageLink showGithubLink={githubConfig.widgetVisible} />
        </main>
        <Footer ownerName={ownerName} socialLinks={socialLinks} />
      </div>
    </ViewTransitionsProvider>
  );
}
