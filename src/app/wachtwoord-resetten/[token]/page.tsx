"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { AuthShell } from "@/components/ui/AuthShell";
import { IconInput } from "@/components/ui/IconInput";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/inloggen"), 2000);
  }

  return (
    <AuthShell title="Nieuw wachtwoord" subtitle="Kies een nieuw wachtwoord voor je account.">
      {done ? (
        <p className="mt-5 text-sm text-center" style={{ color: "var(--success-600)" }}>
          Wachtwoord gewijzigd. Je wordt doorgestuurd naar inloggen...
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <IconInput
            icon={Lock}
            type="password"
            required
            placeholder="Nieuw wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Bezig..." : "Wachtwoord instellen"}
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
