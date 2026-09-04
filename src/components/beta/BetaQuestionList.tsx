"use client";

import { useState } from "react";
import { BetaQuestionCard, type BetaQuestion } from "./BetaQuestionCard";

export function BetaQuestionList({ questions }: { questions: BetaQuestion[] }) {
  const [hideReviewed, setHideReviewed] = useState(false);
  const visible = hideReviewed ? questions.filter((q) => !q.lastReview) : questions;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold px-1 cursor-pointer">
        <input type="checkbox" checked={hideReviewed} onChange={(e) => setHideReviewed(e.target.checked)} />
        Verberg al beoordeelde vragen
      </label>
      {visible.length === 0 ? (
        <div className="card p-4 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
          Niets meer te beoordelen hier.
        </div>
      ) : (
        visible.map((q) => <BetaQuestionCard key={q.id} question={q} />)
      )}
    </div>
  );
}
