"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bookmark } from "lucide-react";

type Item = { id: string; prompt: string; topicName: string; difficulty: number };

export function FoutenClient({ mistakes, saved }: { mistakes: Item[]; saved: Item[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"mistakes" | "saved">("mistakes");
  const items = tab === "mistakes" ? mistakes : saved;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mijn fouten</h1>
      <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
        Vragen die je eerder fout had, of die je hebt bewaard om later te bekijken.
      </p>

      <div className="flex gap-2 mb-4">
        <TabButton active={tab === "mistakes"} onClick={() => setTab("mistakes")} label={`Fouten (${mistakes.length})`} />
        <TabButton active={tab === "saved"} onClick={() => setTab("saved")} label={`Bewaard (${saved.length})`} />
      </div>

      {items.length === 0 ? (
        <div className="card p-6 text-center" style={{ color: "var(--foreground-muted)" }}>
          {tab === "mistakes" ? "Geen openstaande fouten. Goed bezig!" : "Nog niets bewaard."}
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex items-start gap-3">
              {tab === "mistakes" ? (
                <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--danger-500)" }} />
              ) : (
                <Bookmark size={18} className="mt-0.5 shrink-0" style={{ color: "var(--accent-500)" }} />
              )}
              <div>
                <p className="text-sm font-medium leading-snug">{item.prompt}</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                  {item.topicName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "mistakes" && mistakes.length > 0 && (
        <button className="btn-primary w-full" onClick={() => router.push("/app/sessie?mode=MISTAKES")}>
          Oefen deze fouten
        </button>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 rounded-xl text-sm font-semibold transition"
      style={{
        background: active ? "var(--brand-500)" : "var(--surface-muted)",
        color: active ? "white" : "var(--foreground-muted)",
      }}
    >
      {label}
    </button>
  );
}
