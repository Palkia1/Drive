"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const COLORS = ["var(--brand-500)", "var(--accent-500)", "var(--success-500)", "var(--danger-400)", "var(--gold-500)"];

function makePieces(count: number, big: boolean) {
  const spread = big ? 640 : 320;
  const fallBase = big ? 420 : 220;
  const fallExtra = big ? 320 : 80;
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * spread,
    y: fallBase + Math.random() * fallExtra,
    rotate: Math.random() * 360 * (big ? 2 : 1),
    delay: Math.random() * (big ? 0.5 : 0.15),
    color: COLORS[i % COLORS.length],
    size: big ? 7 + Math.random() * 9 : 6 + Math.random() * 6,
    shape: Math.random() > 0.5 ? "50%" : "3px",
  }));
}

/** A confetti burst. Default is a short, tasteful pop confined to its parent
 * — used for a solid (>=60%) session score, level-ups, badges, streak
 * milestones. `big` is a fuller, full-viewport rain reserved for a perfect
 * (100%) score: more pieces, wider spread, longer fall. */
export function Confetti({ count = 28, big = false }: { count?: number; big?: boolean }) {
  const pieceCount = big ? Math.max(count, 90) : count;
  // Lazy initializer: pieces are randomized once when the component mounts,
  // not recomputed (impurely) on every render.
  const [pieces] = useState(() => makePieces(pieceCount, big));

  return (
    <div
      className={
        big
          ? "pointer-events-none fixed inset-0 overflow-hidden z-50 flex items-start justify-center"
          : "pointer-events-none absolute inset-0 overflow-hidden flex items-start justify-center"
      }
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: big ? 1.7 : 1.1, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: big ? 0 : 40,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape,
          }}
        />
      ))}
    </div>
  );
}
