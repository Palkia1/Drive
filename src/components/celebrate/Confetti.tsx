"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const COLORS = ["var(--brand-500)", "var(--accent-500)", "var(--success-500)", "var(--danger-400)"];

function makePieces(count: number) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 320,
    y: 220 + Math.random() * 80,
    rotate: Math.random() * 360,
    delay: Math.random() * 0.15,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 6,
    shape: Math.random() > 0.5 ? "50%" : "3px",
  }));
}

/** A short, tasteful confetti burst — not a full-screen particle storm. Used
 * for level-ups, badges and streak milestones (brief §32): premium, not childish. */
export function Confetti({ count = 28 }: { count?: number }) {
  // Lazy initializer: pieces are randomized once when the component mounts,
  // not recomputed (impurely) on every render.
  const [pieces] = useState(() => makePieces(count));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-start justify-center">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: 40,
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
