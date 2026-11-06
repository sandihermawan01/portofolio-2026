"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        // Sign out of the client SDK too — a rejected session means this
        // account is not authorized for admin, so don't leave it signed in.
        await auth.signOut();
        setError(result.error ?? "Login gagal.");
        setLoading(false);
        return;
      }

      const next = searchParams.get("next") ?? "/admin";
      router.push(next);
      router.refresh();
    } catch {
      setError("Email atau password salah.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <p className="index-label mb-2 text-center">ADMIN ACCESS</p>
        <h1 className="mb-8 text-center font-display text-2xl font-semibold">Masuk ke Dashboard</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses…" : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tidak ada pendaftaran publik. Akun admin dibuat oleh pemilik melalui Firebase Console.
        </p>
      </div>
    </div>
  );
}
