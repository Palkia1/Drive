"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/ui/AuthShell";
import { IconInput } from "@/components/ui/IconInput";

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
    <AuthShell title="Maak je account" subtitle="Gratis, ook zonder rijschool.">
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <IconInput icon={User} required placeholder="Naam" value={name} onChange={(e) => setName(e.target.value)} />
        <IconInput icon={Mail} type="email" required placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} />
        <IconInput
          icon={Lock}
          type="password"
          required
          minLength={8}
          placeholder="Wachtwoord (min. 8 tekens)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center gap-2 pt-1">
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
            Rijles bij een rijschool?
          </span>
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>
        <IconInput
          icon={KeyRound}
          placeholder="Rijschoolcode (optioneel)"
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

      <p className="mt-6 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
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
    </AuthShell>
  );
}
