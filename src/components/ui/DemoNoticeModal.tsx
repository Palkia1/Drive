"use client";

import { useEffect, useState } from "react";
import { Construction } from "lucide-react";

const DISMISSED_KEY = "demo-notice-dismissed";

/** A one-time reminder that this is a demo build — shown once per browser
 * session (sessionStorage, not localStorage) so it resurfaces on a fresh
 * visit instead of nagging on every navigation within one. */
export function DemoNoticeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // sessionStorage only exists client-side, so this genuinely can't be
    // computed during render — has to run once after mount.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only API, not synchronizing derived state
      if (!sessionStorage.getItem(DISMISSED_KEY)) setOpen(true);
    } catch {
      // Storage can throw in some private-browsing modes — just skip the
      // notice rather than crash the app over it.
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={dismiss} />
      <div
        className="relative w-full max-w-sm rounded-[26px] p-6 text-center animate-pop-in"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="icon-bubble mx-auto mb-4"
          style={{ width: 52, height: 52, borderRadius: 16, background: "var(--gold-500)" }}
        >
          <Construction size={26} color="white" />
        </div>
        <h2 className="text-lg font-extrabold mb-2">Dit is een demo-versie</h2>
        <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)" }}>
          Rijklaar is nog volop in ontwikkeling — niet alle functies zijn al af of foutloos. Wees een beetje
          lief voor de developers. 💙
        </p>
        <button type="button" onClick={dismiss} className="btn-primary w-full">
          Begrepen
        </button>
      </div>
    </div>
  );
}
