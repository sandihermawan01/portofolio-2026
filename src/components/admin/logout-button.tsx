"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" });
    await signOut(auth);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut /> Logout
    </Button>
  );
}
