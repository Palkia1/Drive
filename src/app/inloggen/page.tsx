"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/ui/AuthShell";
import { IconInput } from "@/components/ui/IconInput";
import { GoogleLogo } from "@/components/icons/GoogleLogo";
import { AppleLogo } from "@/components/icons/AppleLogo";

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
    <AuthShell title="Welkom terug" subtitle="Log in om verder te oefenen.">
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <IconInput icon={Mail} type="email" required placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} />
        <IconInput
          icon={Lock}
          type="password"
          required
          placeholder="Wachtwoord"
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

      <div className="mt-5">
        <div className="flex items-center gap-3">
          <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
            Of ga verder met
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <SocialCircle label="Google">
            <GoogleLogo size={20} />
          </SocialCircle>
          <SocialCircle label="Apple">
            <AppleLogo size={20} />
          </SocialCircle>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: "var(--foreground-muted)" }}>
          Nog niet actief in deze omgeving.
        </p>
      </div>

      <p className="mt-6 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
        Nog geen account?{" "}
        <Link href="/registreren" className="font-semibold" style={{ color: "var(--brand-600)" }}>
          Registreer gratis
        </Link>
      </p>
    </AuthShell>
  );
}

function SocialCircle({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="w-11 h-11 rounded-full flex items-center justify-center opacity-60 cursor-not-allowed"
      style={{ background: "var(--surface-muted)", color: "var(--foreground-muted)", boxShadow: "inset 0 0 0 1.5px var(--border)" }}
    >
      {children}
    </button>
  );
}
