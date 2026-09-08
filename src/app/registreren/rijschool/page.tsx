"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Building2, User, Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/ui/AuthShell";
import { IconInput } from "@/components/ui/IconInput";

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolName, ownerName, email, password }),
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
    router.push("/school");
    router.refresh();
  }

  return (
    <AuthShell title="Registreer je rijschool" subtitle="Je krijgt direct een unieke rijschoolcode om aan leerlingen te geven.">
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <IconInput icon={Building2} required placeholder="Naam rijschool" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
        <IconInput icon={User} required placeholder="Jouw naam" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
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
        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
          Je start met een proefperiode voor 5 leerlingen. Meer plekken nodig? Neem contact met ons op.
        </p>
        {error && (
          <p className="text-sm font-medium" style={{ color: "var(--danger-500)" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Bezig..." : "Rijschool aanmaken"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
        Ben je een leerling?{" "}
        <Link href="/registreren" className="font-semibold" style={{ color: "var(--brand-600)" }}>
          Registreer hier
        </Link>
      </p>
    </AuthShell>
  );
}
