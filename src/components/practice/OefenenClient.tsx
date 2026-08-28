"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ListChecks, RotateCcw, TrendingDown, GraduationCap, ChevronRight, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TopicIcon, getTopicColor } from "@/components/topics/TopicIcon";
import type { TopicMasterySummary } from "@/lib/mastery";

export function OefenenClient({
  topics,
  mistakesCount,
}: {
  topics: TopicMasterySummary[];
  mistakesCount: number;
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  function start(mode: string, topicIds: string[] = []) {
    router.push(`/app/sessie?mode=${mode}&topics=${topicIds.join(",")}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Oefenen</h1>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Kies één manier om te oefenen.
        </p>
      </div>

      <div className="space-y-2.5">
        <MenuRow
          icon={<Zap size={20} color="white" />}
          color="var(--primary-500)"
          title="Snel oefenen"
          subtitle="8 gemixte vragen"
          onClick={() => start("QUICK")}
        />
        <MenuRow
          icon={<ListChecks size={20} color="white" />}
          color="var(--brand-500)"
          title="Onderwerp kiezen"
          subtitle="Kies zelf één of meer onderwerpen"
          onClick={() => setSheetOpen(true)}
        />
        <MenuRow
          icon={<TrendingDown size={20} color="white" />}
          color="var(--gold-600)"
          title="Zwakke punten"
          subtitle="Waar je nog moeite mee hebt"
          onClick={() => start("WEAK_SPOTS")}
        />
        <MenuRow
          icon={<RotateCcw size={20} color="white" />}
          color="var(--danger-500)"
          title="Fouten oefenen"
          subtitle={mistakesCount > 0 ? `${mistakesCount} openstaand` : "Geen openstaande fouten"}
          disabled={mistakesCount === 0}
          onClick={() => start("MISTAKES")}
        />
        <MenuRow
          icon={<GraduationCap size={20} color="white" />}
          color="var(--purple-500)"
          title="Oefenexamen"
          subtitle="20 vragen, echte tijdsdruk"
          onClick={() => start("EXAM")}
        />
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Kies onderwerpen">
        <div className="space-y-1.5 mb-4 max-h-[52vh] overflow-y-auto">
          {topics.map((t) => {
            const isSelected = selectedTopics.includes(t.topicId);
            return (
              <button
                key={t.topicId}
                type="button"
                onClick={() =>
                  setSelectedTopics((prev) =>
                    prev.includes(t.topicId) ? prev.filter((id) => id !== t.topicId) : [...prev, t.topicId]
                  )
                }
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-2xl transition"
                style={{ background: isSelected ? "var(--brand-50)" : "transparent" }}
              >
                <div className="icon-bubble" style={{ width: 36, height: 36, borderRadius: 11, background: getTopicColor(t.topicIcon) }}>
                  <TopicIcon icon={t.topicIcon} size={18} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{t.topicName}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {t.insufficientData ? "Onvoldoende data" : `Level ${t.level}/5`}
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected ? "var(--primary-500)" : "var(--surface-muted)",
                    boxShadow: isSelected ? "none" : "inset 0 0 0 2px var(--border)",
                  }}
                >
                  {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
        <button
          className="btn-primary w-full"
          disabled={selectedTopics.length === 0}
          onClick={() => start("TOPIC", selectedTopics)}
        >
          {selectedTopics.length === 0
            ? "Selecteer een onderwerp"
            : `Start (${selectedTopics.length} onderwerp${selectedTopics.length > 1 ? "en" : ""})`}
        </button>
      </BottomSheet>
    </div>
  );
}

function MenuRow({
  icon,
  color,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="menu-row">
      <div className="icon-bubble" style={{ background: color }}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="font-bold text-[15px] truncate">{title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--foreground-muted)" }}>
          {subtitle}
        </p>
      </div>
      <ChevronRight size={18} style={{ color: "var(--foreground-muted)" }} />
    </button>
  );
}
