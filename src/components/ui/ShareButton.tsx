"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/** Native share sheet when available (mobile browsers, most desktop
 * browsers over HTTPS), falling back to a clipboard copy + "Gekopieerd!"
 * confirmation otherwise — no public URL involved, just a text summary the
 * student shares wherever they like. */
export function ShareButton({ text, className = "btn-secondary w-full" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled the share sheet, or it failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing more we can do here.
    }
  }

  return (
    <button type="button" onClick={share} className={`${className} flex items-center justify-center gap-1.5`}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Gekopieerd!" : "Deel je resultaat"}
    </button>
  );
}
