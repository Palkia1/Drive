"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";

export function BetaTesterToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await fetch("/api/beta/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    }).catch(() => {});
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="flex items-center gap-2.5 text-sm">
          <div className="icon-bubble shrink-0" style={{ width: 26, height: 26, borderRadius: 8, background: "var(--purple-600)" }}>
            <FlaskConical size={14} color="white" />
          </div>
          Beta-tester
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={saving}
          className="w-11 h-6 rounded-full relative shrink-0 transition"
          style={{ background: enabled ? "var(--purple-500)" : "var(--surface-muted)" }}
        >
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: enabled ? 22 : 2 }} />
        </button>
      </label>
      <p className="text-xs px-1" style={{ color: "var(--foreground-muted)" }}>
        Geeft toegang tot het feedbackportaal om vragen te beoordelen, aan te passen of weg te gooien.
      </p>
      {enabled && (
        <Link
          href="/app/beta"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "color-mix(in srgb, var(--purple-500) 12%, transparent)", color: "var(--purple-600)" }}
        >
          Open feedbackportaal
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
