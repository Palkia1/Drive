"use client";

import { useState } from "react";
import { Check, X, Bookmark } from "lucide-react";
import { IntersectionScene } from "@/components/scenes/IntersectionScene";
import { SignStripScene } from "@/components/scenes/SignStripScene";
import { SignIcon } from "@/components/scenes/SignIcon";
import type { QuestionScene } from "@/lib/questions/types";
import type { SubmittedAnswer } from "@/lib/answers";

export type ClientQuestion = {
  id: string;
  topicId: string;
  type: string;
  difficulty: number;
  prompt: string;
  scene: QuestionScene;
};

export function QuestionCard({
  question,
  sessionId,
  isExam,
  initiallySaved,
  onAnswered,
}: {
  question: ClientQuestion;
  sessionId: string;
  isExam: boolean;
  initiallySaved?: boolean;
  onAnswered: (answer: SubmittedAnswer, isCorrect: boolean) => void;
}) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [saved, setSaved] = useState(Boolean(initiallySaved));

  async function toggleSaved() {
    setSaved((s) => !s);
    await fetch("/api/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id }),
    }).catch(() => {});
  }

  const scene = question.scene;
  const locked = submitting || result !== null;

  async function submit(answer: SubmittedAnswer) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answer, timeMs: 0 }),
      });
      const data = await res.json();
      const isCorrect = Boolean(data.isCorrect);
      setResult(isCorrect ? "correct" : "incorrect");
      setTimeout(() => onAnswered(answer, isCorrect), isExam ? 250 : 700);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-5 relative overflow-hidden">
      {scene.kind === "SINGLE_CHOICE" && scene.promptSignId && (
        <div className="flex justify-center mb-4">
          <SignIcon id={scene.promptSignId} size={104} />
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-lg font-semibold leading-snug">{question.prompt}</p>
        <button
          type="button"
          aria-label={saved ? "Verwijder uit bewaard" : "Bewaar deze vraag"}
          onClick={toggleSaved}
          className="shrink-0 p-1.5 rounded-lg transition"
          style={{ color: saved ? "var(--accent-500)" : "var(--foreground-muted)" }}
        >
          <Bookmark size={20} fill={saved ? "var(--accent-500)" : "none"} />
        </button>
      </div>

      {scene.kind === "SINGLE_CHOICE" && (
        <div className="space-y-2">
          {scene.options.map((opt) => {
            const isSelected = selectedOptionIds[0] === opt.id;
            const outcome = result && isSelected ? result : null;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  setSelectedOptionIds([opt.id]);
                  submit({ kind: "SINGLE_CHOICE", optionId: opt.id });
                }}
                className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition disabled:pointer-events-none"
                style={optionStyle(outcome, isSelected)}
              >
                {opt.signId && <SignIcon id={opt.signId} size={36} />}
                <span className="font-medium">{opt.label}</span>
                {outcome && <OutcomeIcon outcome={outcome} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}

      {scene.kind === "MULTIPLE_CHOICE" && (
        <div className="space-y-2">
          {scene.options.map((opt) => {
            const isSelected = selectedOptionIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={locked}
                onClick={() =>
                  setSelectedOptionIds((prev) =>
                    prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                  )
                }
                className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition disabled:pointer-events-none"
                style={optionStyle(result, isSelected)}
              >
                {opt.signId && <SignIcon id={opt.signId} size={36} />}
                <span className="font-medium">{opt.label}</span>
                <span className="ml-auto">
                  <Checkbox checked={isSelected} />
                </span>
              </button>
            );
          })}
          <button
            type="button"
            disabled={locked || selectedOptionIds.length === 0}
            onClick={() => submit({ kind: "MULTIPLE_CHOICE", optionIds: selectedOptionIds })}
            className="btn-primary w-full mt-2"
          >
            Controleer
          </button>
        </div>
      )}

      {scene.kind === "HOTSPOT" && scene.sceneId === "intersection" && (
        <IntersectionScene
          actors={scene.actors}
          hasRightOfWaySign={scene.hasRightOfWaySign}
          selectedSlot={selectedSlot as never}
          correctSlot={scene.correctSlot}
          disabled={locked}
          onSelect={(slot) => {
            setSelectedSlot(slot);
            submit({ kind: "HOTSPOT_SLOT", slot });
          }}
        />
      )}

      {scene.kind === "HOTSPOT" && scene.sceneId === "sign-strip" && (
        <SignStripScene
          signs={scene.signs}
          selected={selectedSign as never}
          correctSignId={scene.correctSignId}
          disabled={locked}
          onSelect={(sign) => {
            setSelectedSign(sign);
            submit({ kind: "HOTSPOT_SIGN", signId: sign });
          }}
        />
      )}

      {!isExam && result && (
        <div
          className="absolute inset-x-0 bottom-0 px-5 py-4 flex items-center gap-3 font-extrabold animate-pop-in"
          style={{
            background: result === "correct" ? "var(--primary-500)" : "var(--danger-500)",
            color: "white",
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>
            <OutcomeIcon outcome={result} size={18} />
          </div>
          <span className="text-base">{result === "correct" ? "Goed zo!" : "Niet helemaal."}</span>
        </div>
      )}
    </div>
  );
}

function optionStyle(outcome: "correct" | "incorrect" | null, isSelected: boolean): React.CSSProperties {
  if (outcome && isSelected) {
    const color = outcome === "correct" ? "var(--primary-500)" : "var(--danger-500)";
    return {
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      border: `2.5px solid ${color}`,
      color: `color-mix(in srgb, ${color} 80%, black)`,
    };
  }
  return {
    background: isSelected ? "var(--brand-50)" : "var(--surface-muted)",
    border: `2.5px solid ${isSelected ? "var(--brand-400)" : "transparent"}`,
  };
}

function OutcomeIcon({ outcome, className, size = 20 }: { outcome: "correct" | "incorrect"; className?: string; size?: number }) {
  return outcome === "correct" ? (
    <Check size={size} className={className} strokeWidth={3} />
  ) : (
    <X size={size} className={className} strokeWidth={3} />
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="w-6 h-6 rounded-lg flex items-center justify-center"
      style={{
        background: checked ? "var(--brand-500)" : "transparent",
        boxShadow: checked ? "none" : "inset 0 0 0 2.5px var(--border)",
      }}
    >
      {checked && <Check size={15} color="white" strokeWidth={3} />}
    </span>
  );
}
