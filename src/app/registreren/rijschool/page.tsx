"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [seats, setSeats] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolName, ownerName, email, password, seats }),
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
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-extrabold text-lg tracking-tight" style={{ color: "var(--brand-600)" }}>
          Rijklaar
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Registreer je rijschool</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
          Je krijgt direct een unieke rijschoolcode om aan leerlingen te geven.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input required placeholder="Naam rijschool" className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          <input required placeholder="Jouw naam" className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          <input type="email" required placeholder="E-mailadres" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Wachtwoord (min. 8 tekens)"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="block text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
            Aantal leerlingplekken (later aan te passen)
            <select className="input mt-1" value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} leerlingen
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Bezig..." : "Rijschool aanmaken"}
          </button>
        </form>

        <p className="mt-8 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
          Ben je een leerling?{" "}
          <Link href="/registreren" className="font-semibold" style={{ color: "var(--brand-600)" }}>
            Registreer hier
          </Link>
        </p>
      </div>
    </div>
  );
}
