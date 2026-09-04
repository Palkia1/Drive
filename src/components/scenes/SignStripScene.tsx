"use client";

import type { SignId } from "@/lib/questions/types";
import { SignIcon } from "./SignIcon";

export function SignStripScene({
  signs,
  selected,
  correctSignId,
  disabled,
  onSelect,
}: {
  signs: SignId[];
  selected?: SignId | null;
  correctSignId: SignId;
  disabled?: boolean;
  onSelect: (sign: SignId) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap py-4">
      {signs.map((sign, index) => {
        const isSelected = selected === sign;
        const outcome = disabled && isSelected ? (sign === correctSignId ? "correct" : "incorrect") : null;
        return (
          <button
            key={sign}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(sign)}
            // Deliberately generic (position only, not the sign's code or
            // name) — recognizing the sign visually is the point of these
            // questions, so a descriptive label would hand a screen-reader
            // user the answer that a sighted user still has to work out.
            aria-label={`Verkeersbord, optie ${index + 1} van ${signs.length}`}
            className="rounded-2xl p-3 transition active:scale-95 disabled:pointer-events-none"
            style={{
              background: "var(--surface-muted)",
              boxShadow:
                outcome === "correct"
                  ? "0 0 0 3px var(--success-500)"
                  : outcome === "incorrect"
                    ? "0 0 0 3px var(--danger-500)"
                    : "none",
            }}
          >
            <SignIcon id={sign} size={64} />
          </button>
        );
      })}
    </div>
  );
}
