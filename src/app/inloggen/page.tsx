"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("E-mailadres of wachtwoord klopt niet.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
          Rijklaar
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Welkom terug</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
          Log in om verder te oefenen.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="E-mailadres"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Wachtwoord"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Bezig..." : "Inloggen"}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <button type="button" disabled className="btn-secondary w-full opacity-60 cursor-not-allowed">
            Doorgaan met Google
          </button>
          <button type="button" disabled className="btn-secondary w-full opacity-60 cursor-not-allowed">
            Doorgaan met Apple
          </button>
          <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
            Google/Apple-login is voorbereid maar nog niet actief in deze omgeving.
          </p>
        </div>

        <p className="mt-8 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
          Nog geen account?{" "}
          <Link href="/registreren" className="font-semibold" style={{ color: "var(--brand-600)" }}>
            Registreer gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
