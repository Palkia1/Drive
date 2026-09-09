"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { HomeworkView } from "@/lib/homework";

export function HomeworkPanel({
  studentId,
  homework,
  topics,
}: {
  studentId: string;
  homework: HomeworkView[];
  topics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [topicId, setTopicId] = useState<string>("");
  const [targetCount, setTargetCount] = useState(20);
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/school/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        topicId: topicId || null,
        targetCount,
        note: note.trim() || null,
        dueDate: dueDate || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      return;
    }
    setNote("");
    setShowForm(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/school/homework/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">Huiswerk</h2>
        <button type="button" className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--brand-600)" }} onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> Toewijzen
        </button>
      </div>

      {showForm && (
        <form onSubmit={assign} className="mb-4 p-3 rounded-xl space-y-2" style={{ background: "var(--surface-muted)" }}>
          <div className="flex gap-2">
            <select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">Alle onderwerpen</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              className="input w-28"
              type="number"
              min={1}
              max={200}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              aria-label="Aantal vragen"
            />
          </div>
          <input className="input" placeholder="Notitie (optioneel)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Einddatum (optioneel)" />
          {error && (
            <p className="text-sm" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            Huiswerk toewijzen
          </button>
        </form>
      )}

      {homework.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Nog geen huiswerk toegewezen.
        </p>
      ) : (
        <div className="space-y-3">
          {homework.map((h) => (
            <div key={h.id} className="p-3 rounded-xl" style={{ background: "var(--surface-muted)" }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    {h.done && <CheckCircle2 size={14} style={{ color: "var(--success-600)" }} />}
                    {h.topicName ?? "Alle onderwerpen"} — {h.progress}/{h.targetCount}
                  </p>
                  {h.note && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      {h.note}
                    </p>
                  )}
                  {h.dueDate && (
                    <p className="text-xs mt-0.5" style={{ color: h.overdue ? "var(--danger-500)" : "var(--foreground-muted)" }}>
                      {h.overdue ? "Verlopen op" : "Tot"} {new Date(h.dueDate).toLocaleDateString("nl-NL")}
                    </p>
                  )}
                </div>
                <button type="button" aria-label="Verwijder huiswerk" onClick={() => remove(h.id)} style={{ color: "var(--foreground-muted)" }}>
                  <Trash2 size={15} />
                </button>
              </div>
              <ProgressBar value={h.progress} max={h.targetCount} color={h.done ? "var(--success-500)" : "var(--brand-500)"} height={6} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
