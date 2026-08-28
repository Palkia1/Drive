"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ListChecks, RotateCcw, TrendingDown, GraduationCap } from "lucide-react";
import { MasteryBar } from "@/components/ui/MasteryBar";
import type { TopicMasterySummary } from "@/lib/mastery";

export function OefenenClient({
  topics,
  mistakesCount,
}: {
  topics: TopicMasterySummary[];
  mistakesCount: number;
}) {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  function start(mode: string, topicIds: string[] = []) {
    router.push(`/app/sessie?mode=${mode}&topics=${topicIds.join(",")}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Oefenen</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Kies hoe je wilt oefenen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ModeCard icon={<Zap size={20} />} title="Snel oefenen" subtitle="8 gemixte vragen" onClick={() => start("QUICK")} />
        <ModeCard
          icon={<TrendingDown size={20} />}
          title="Zwakke punten"
          subtitle="Waar je nog moeite mee hebt"
          onClick={() => start("WEAK_SPOTS")}
        />
        <ModeCard
          icon={<RotateCcw size={20} />}
          title="Fouten oefenen"
          subtitle={mistakesCount > 0 ? `${mistakesCount} openstaand` : "Geen openstaande fouten"}
          disabled={mistakesCount === 0}
          onClick={() => start("MISTAKES")}
        />
        <ModeCard icon={<GraduationCap size={20} />} title="Oefenexamen" subtitle="20 vragen, echte tijdsdruk" onClick={() => start("EXAM")} />
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={18} style={{ color: "var(--brand-600)" }} />
          <h2 className="font-semibold">Onderwerp oefenen</h2>
        </div>
        <div className="space-y-4">
          {topics.map((t) => (
            <label key={t.topicId} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded accent-[var(--brand-500)]"
                checked={selectedTopics.includes(t.topicId)}
                onChange={() =>
                  setSelectedTopics((prev) =>
                    prev.includes(t.topicId) ? prev.filter((id) => id !== t.topicId) : [...prev, t.topicId]
                  )
                }
              />
              <div className="flex-1">
                <MasteryBar name={t.topicName} level={t.level} insufficientData={t.insufficientData} compact />
              </div>
            </label>
          ))}
        </div>
        <button
          className="btn-primary w-full mt-5"
          disabled={selectedTopics.length === 0}
          onClick={() => start("TOPIC", selectedTopics)}
        >
          {selectedTopics.length === 0
            ? "Selecteer één of meer onderwerpen"
            : `Start oefening (${selectedTopics.length} onderwerp${selectedTopics.length > 1 ? "en" : ""})`}
        </button>
      </div>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="card p-4 text-left transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
        {icon}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
        {subtitle}
      </p>
    </button>
  );
}
