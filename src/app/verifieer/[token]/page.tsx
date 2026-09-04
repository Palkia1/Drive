"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/ui/AuthShell";

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <AuthShell title="E-mailadres bevestigen" subtitle="">
      <div className="mt-5 flex flex-col items-center gap-3 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-500)" }} />
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
              Bezig met bevestigen...
            </p>
          </>
        )}
        {status === "ok" && (
          <>
            <CircleCheck size={32} style={{ color: "var(--success-500)" }} />
            <p className="text-sm font-medium">Je e-mailadres is bevestigd.</p>
          </>
        )}
        {status === "error" && (
          <>
            <CircleX size={32} style={{ color: "var(--danger-500)" }} />
            <p className="text-sm font-medium">Deze link is ongeldig of verlopen.</p>
          </>
        )}
        <Link href="/app" className="btn-primary w-full mt-2">
          Naar de app
        </Link>
      </div>
    </AuthShell>
  );
}
