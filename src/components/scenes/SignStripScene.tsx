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
      {signs.map((sign) => {
        const isSelected = selected === sign;
        const outcome = disabled && isSelected ? (sign === correctSignId ? "correct" : "incorrect") : null;
        return (
          <button
            key={sign}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(sign)}
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
