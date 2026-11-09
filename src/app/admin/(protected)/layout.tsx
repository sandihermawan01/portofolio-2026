import { redirect } from "next/navigation";
import { getVerifiedAdminSession } from "@/lib/firebase/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { PageTransition } from "@/components/layout/page-transition";

/**
 * Real authorization boundary for every /admin/* page except /admin/login.
 * `middleware.ts` only redirects based on cookie *presence* for UX; this
 * server component performs the actual cryptographic verification via
 * `getVerifiedAdminSession()` and is what actually keeps non-admins out —
 * it runs on every request to every nested page, since Next.js always
 * executes layouts on the server for each navigation.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getVerifiedAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar email={session.email} />
      <div className="flex-1">
        <AdminMobileNav email={session.email} />
        <main className="container-editorial py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
