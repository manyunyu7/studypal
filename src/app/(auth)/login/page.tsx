"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
      });

      // signIn with redirectTo usually navigates away; if it returns, something went wrong
      if (result?.error) {
        setError("Email atau kata sandi salah. Silakan coba lagi.");
      }
    } catch {
      // NextAuth may throw a redirect — that's expected and fine
      // Only treat non-redirect throws as errors
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Mobile brand */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/15 border border-primary/30">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4 text-primary"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <span className="text-lg font-semibold text-foreground">StudyPal</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Selamat datang kembali 👋
        </h2>
        <p className="text-muted-foreground">
          Yuk lanjut belajar, kamu pasti bisa 🔥
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-foreground text-sm font-medium"
            >
              Alamat Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="kamu@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-ring/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-foreground text-sm font-medium"
              >
                Kata Sandi
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-ring/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-medium text-sm transition-colors disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                />
              </svg>
              Masuk...
            </span>
          ) : (
            "Masuk"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="text-primary hover:text-primary/90 font-medium transition-colors"
        >
          Daftar di sini
        </Link>
      </p>

      {/* Tanda tangan */}
      <p className="text-center text-xs text-muted-foreground">
        Dibuat dengan ❤️ oleh <span className="font-medium text-foreground">Henry</span>
      </p>
    </div>
  );
}
