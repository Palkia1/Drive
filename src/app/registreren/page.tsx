"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, schoolCode: schoolCode || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/inloggen");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
          Rijklaar
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Maak je account</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
          Gratis, ook zonder rijschool.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input required placeholder="Naam" className="input" value={name} onChange={(e) => setName(e.target.value)} />
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
            minLength={8}
            placeholder="Wachtwoord (min. 8 tekens)"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            placeholder="Rijschoolcode (optioneel)"
            className="input uppercase"
            maxLength={6}
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
          />
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Bezig..." : "Account aanmaken"}
          </button>
        </form>

        <p className="mt-8 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
          Al een account?{" "}
          <Link href="/inloggen" className="font-semibold" style={{ color: "var(--brand-600)" }}>
            Inloggen
          </Link>
        </p>
        <p className="mt-2 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
          Rijschoolhouder?{" "}
          <Link href="/registreren/rijschool" className="font-semibold" style={{ color: "var(--brand-600)" }}>
            Registreer je rijschool
          </Link>
        </p>
      </div>
    </div>
  );
}
