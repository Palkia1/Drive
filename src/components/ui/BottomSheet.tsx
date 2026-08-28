"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** A single, focused bottom sheet — used instead of showing every option at
 * once. Keeps one decision on screen at a time (brief-driven UX request). */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-[28px] p-5 pb-8 animate-sheet-up max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--surface)" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full" style={{ background: "var(--border)" }} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button
            type="button"
            aria-label="Sluiten"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-muted)", color: "var(--foreground-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
