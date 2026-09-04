"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

/** Non-blocking nudge shown on Home while the account's e-mail isn't
 * verified yet — never gates login or practice, just prompts. */
export function EmailVerificationBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setStatus("sending");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setStatus(res.ok ? "sent" : "error");
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl text-sm"
      style={{ background: "color-mix(in srgb, var(--gold-500) 12%, transparent)" }}
    >
      <Mail size={18} style={{ color: "var(--gold-600)" }} className="shrink-0" />
      <p className="flex-1" style={{ color: "var(--foreground)" }}>
        Bevestig je e-mailadres om je account veilig te houden.
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={status === "sending" || status === "sent"}
        className="font-semibold shrink-0"
        style={{ color: "var(--gold-600)" }}
      >
        {status === "sent" ? "Verstuurd" : status === "sending" ? "Bezig..." : "Verstuur opnieuw"}
      </button>
    </div>
  );
}
