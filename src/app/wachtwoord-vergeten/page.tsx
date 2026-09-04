"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/ui/AuthShell";
import { IconInput } from "@/components/ui/IconInput";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Er ging iets mis.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell title="Wachtwoord vergeten" subtitle="We sturen je een link om een nieuw wachtwoord in te stellen.">
      {sent ? (
        <p className="mt-5 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
          Staat er een account onder dit e-mailadres, dan ontvang je zo een e-mail met een resetlink.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <IconInput icon={Mail} type="email" required placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Bezig..." : "Verstuur resetlink"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
        <Link href="/inloggen" className="font-semibold" style={{ color: "var(--brand-600)" }}>
          Terug naar inloggen
        </Link>
      </p>
    </AuthShell>
  );
}
