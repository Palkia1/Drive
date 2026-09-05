"use client";

import { useState } from "react";
import { Check, Trash2, Pencil, ListChecks, Star } from "lucide-react";
import { SceneReview } from "./SceneReview";
import { getHotspotAnswerOptions } from "@/lib/questions/answerOptions";
import type { QuestionScene } from "@/lib/questions/types";

type ReviewInfo = { action: string; createdAt: string } | null;

export type BetaQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  type: string;
  status: string;
  difficulty: number;
  scene: QuestionScene;
  lastReview: ReviewInfo;
};

const ACTION_LABEL: Record<string, string> = {
  APPROVED: "Goedgekeurd door jou",
  EDITED_PROMPT: "Vraag aangepast door jou",
  EDITED_ANSWERS: "Antwoorden aangepast door jou",
  DISCARDED: "Weggegooid door jou",
};

type Mode = "view" | "edit-prompt" | "edit-answers";

export function BetaQuestionCard({ question }: { question: BetaQuestion }) {
  const [q, setQ] = useState(question);
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const discarded = q.status === "ARCHIVED";

  async function post(body: object) {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch(`/api/beta/questions/${q.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      setFlash("Opslaan mislukt — probeer opnieuw.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    const ok = await post({ action: "APPROVED" });
    if (ok) {
      setQ((p) => ({ ...p, lastReview: { action: "APPROVED", createdAt: new Date().toISOString() } }));
      setFlash("Goedgekeurd");
    }
  }

  async function discard() {
    if (!confirm("Deze vraag weggooien? Hij verdwijnt direct uit alle oefensessies.")) return;
    const ok = await post({ action: "DISCARDED" });
    if (ok) {
      setQ((p) => ({ ...p, status: "ARCHIVED", lastReview: { action: "DISCARDED", createdAt: new Date().toISOString() } }));
      setFlash("Weggegooid");
    }
  }

  async function savePrompt(prompt: string, explanation: string) {
    const ok = await post({ action: "EDITED_PROMPT", prompt, explanation: explanation || null });
    if (ok) {
      setQ((p) => ({ ...p, prompt, explanation: explanation || null, lastReview: { action: "EDITED_PROMPT", createdAt: new Date().toISOString() } }));
      setMode("view");
      setFlash("Vraag opgeslagen");
    }
  }

  async function saveAnswers(scene: QuestionScene) {
    const ok = await post({ action: "EDITED_ANSWERS", scene });
    if (ok) {
      setQ((p) => ({ ...p, scene, lastReview: { action: "EDITED_ANSWERS", createdAt: new Date().toISOString() } }));
      setMode("view");
      setFlash("Antwoorden opgeslagen");
    }
  }

  return (
    <div className="card p-4 space-y-3" style={{ opacity: discarded ? 0.55 : 1 }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} strokeWidth={2.5} color="var(--gold-500)" fill={i < q.difficulty ? "var(--gold-500)" : "none"} />
          ))}
        </div>
        {discarded && (
          <span className="pill" style={{ background: "color-mix(in srgb, var(--danger-500) 15%, transparent)", color: "var(--danger-600)", fontSize: "0.72rem" }}>
            Weggegooid
          </span>
        )}
        {q.lastReview && !discarded && (
          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            {ACTION_LABEL[q.lastReview.action] ?? q.lastReview.action}
          </span>
        )}
      </div>

      {mode === "edit-prompt" ? (
        <PromptEditor prompt={q.prompt} explanation={q.explanation ?? ""} busy={busy} onCancel={() => setMode("view")} onSave={savePrompt} />
      ) : (
        <>
          <p className="font-semibold leading-snug">{q.prompt}</p>
          <SceneReview scene={q.scene} />
          {q.explanation && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "var(--surface-muted)", color: "var(--foreground-muted)" }}>
              {q.explanation}
            </p>
          )}
        </>
      )}

      {mode === "edit-answers" && (
        <AnswersEditor scene={q.scene} busy={busy} onCancel={() => setMode("view")} onSave={saveAnswers} />
      )}

      {flash && (
        <p className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
          {flash}
        </p>
      )}

      {mode === "view" && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <ActionButton label="Vraag aanpassen" icon={<Pencil size={14} />} color="var(--brand-600)" onClick={() => setMode("edit-prompt")} disabled={busy || discarded} />
          <ActionButton label="Antwoorden aanpassen" icon={<ListChecks size={14} />} color="var(--purple-600)" onClick={() => setMode("edit-answers")} disabled={busy || discarded} />
          <ActionButton label="Weggooien" icon={<Trash2 size={14} />} color="var(--danger-600)" onClick={discard} disabled={busy || discarded} />
          <ActionButton label="Goedkeuren" icon={<Check size={14} />} color="var(--success-600)" solid onClick={approve} disabled={busy || discarded} />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  icon,
  color,
  onClick,
  disabled,
  solid,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
      style={
        solid
          ? { background: color, color: "white" }
          : { background: `color-mix(in srgb, ${color} 12%, transparent)`, color }
      }
    >
      {icon}
      {label}
    </button>
  );
}

function PromptEditor({
  prompt,
  explanation,
  busy,
  onCancel,
  onSave,
}: {
  prompt: string;
  explanation: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (prompt: string, explanation: string) => void;
}) {
  const [p, setP] = useState(prompt);
  const [e, setE] = useState(explanation);
  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          Vraagtekst
        </label>
        <textarea
          value={p}
          onChange={(ev) => setP(ev.target.value)}
          rows={3}
          className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
          style={{ background: "var(--surface-muted)", border: "2px solid transparent" }}
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          Uitleg
        </label>
        <textarea
          value={e}
          onChange={(ev) => setE(ev.target.value)}
          rows={3}
          className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
          style={{ background: "var(--surface-muted)", border: "2px solid transparent" }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || !p.trim()}
          onClick={() => onSave(p.trim(), e.trim())}
          className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "var(--brand-600)" }}
        >
          Opslaan
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "var(--surface-muted)" }}>
          Annuleren
        </button>
      </div>
    </div>
  );
}

function AnswersEditor({
  scene,
  busy,
  onCancel,
  onSave,
}: {
  scene: QuestionScene;
  busy: boolean;
  onCancel: () => void;
  onSave: (scene: QuestionScene) => void;
}) {
  if (scene.kind === "SINGLE_CHOICE" || scene.kind === "MULTIPLE_CHOICE") {
    return <ChoiceAnswersEditor scene={scene} busy={busy} onCancel={onCancel} onSave={onSave} />;
  }
  return <HotspotAnswerEditor scene={scene} busy={busy} onCancel={onCancel} onSave={onSave} />;
}

function ChoiceAnswersEditor({
  scene,
  busy,
  onCancel,
  onSave,
}: {
  scene: Extract<QuestionScene, { kind: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" }>;
  busy: boolean;
  onCancel: () => void;
  onSave: (scene: QuestionScene) => void;
}) {
  const [labels, setLabels] = useState(scene.options.map((o) => o.label));
  const initialCorrect = scene.kind === "SINGLE_CHOICE" ? [scene.correctOptionId] : scene.correctOptionIds;
  const [correct, setCorrect] = useState<string[]>(initialCorrect);

  function toggleCorrect(id: string) {
    if (scene.kind === "SINGLE_CHOICE") {
      setCorrect([id]);
    } else {
      setCorrect((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  }

  function save() {
    const options = scene.options.map((o, i) => ({ ...o, label: labels[i] }));
    if (scene.kind === "SINGLE_CHOICE") {
      onSave({ ...scene, options, correctOptionId: correct[0] ?? scene.correctOptionId });
    } else {
      onSave({ ...scene, options, correctOptionIds: correct });
    }
  }

  return (
    <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
        Antwoordopties — vink het juiste antwoord aan
      </p>
      {scene.options.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <input
            type={scene.kind === "SINGLE_CHOICE" ? "radio" : "checkbox"}
            name="correct-option"
            checked={correct.includes(opt.id)}
            onChange={() => toggleCorrect(opt.id)}
          />
          <input
            value={labels[i]}
            onChange={(ev) => setLabels((prev) => prev.map((l, idx) => (idx === i ? ev.target.value : l)))}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm"
            style={{ background: "var(--surface-muted)" }}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={busy || correct.length === 0}
          onClick={save}
          className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "var(--purple-600)" }}
        >
          Opslaan
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "var(--surface-muted)" }}>
          Annuleren
        </button>
      </div>
    </div>
  );
}

function HotspotAnswerEditor({
  scene,
  busy,
  onCancel,
  onSave,
}: {
  scene: Extract<QuestionScene, { kind: "HOTSPOT" }>;
  busy: boolean;
  onCancel: () => void;
  onSave: (scene: QuestionScene) => void;
}) {
  const answerOptions = getHotspotAnswerOptions(scene);
  const currentValue = "correctSlot" in scene ? scene.correctSlot : scene.correctSignId;
  const [value, setValue] = useState(currentValue);

  if (!answerOptions) return null;

  function save() {
    onSave({ ...scene, [answerOptions!.field]: value } as QuestionScene);
  }

  return (
    <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
        Wie / wat heeft hier voorrang?
      </p>
      <select
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
        className="w-full px-3 py-2 rounded-xl text-sm"
        style={{ background: "var(--surface-muted)" }}
      >
        {answerOptions.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "var(--purple-600)" }}
        >
          Opslaan
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "var(--surface-muted)" }}>
          Annuleren
        </button>
      </div>
    </div>
  );
}
