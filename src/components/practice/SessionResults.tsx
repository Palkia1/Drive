"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Target, Award } from "lucide-react";
import { Confetti } from "@/components/celebrate/Confetti";
import { ProgressBar } from "@/components/ui/ProgressBar";

export type SessionCompleteResult = {
  totalCount: number;
  correctCount: number;
  xpEarned: number;
  xp: { newLevel: number; leveledUp: boolean };
  streak: { streak: number; streakContinued: boolean } | null;
  dailyGoal: { justCompleted: boolean } | null;
  badges: { name: string; description: string; icon: string }[];
  examResult: {
    scorePct: number;
    passed: boolean;
    breakdown: Record<string, { correct: number; total: number; topicName: string }>;
  } | null;
  masteryAfter: { topicId: string; topicName: string; level: number; insufficientData: boolean }[];
  masterySnapshot: Record<string, number>;
};

export function SessionResults({
  result,
  onRestartSameConfig,
}: {
  result: SessionCompleteResult;
  onRestartSameConfig: () => void;
}) {
  const router = useRouter();
  const streakMilestone = Boolean(result.streak && result.streak.streak > 0 && result.streak.streak % 7 === 0);
  const celebrate = result.xp.leveledUp || result.badges.length > 0 || streakMilestone || (isExamPassed(result));
  const isExam = Boolean(result.examResult);

  return (
    <div className="relative">
      {celebrate && <Confetti />}
      <div className="card p-6 text-center animate-pop-in">
        {isExam ? (
          <>
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
              style={{ background: result.examResult!.passed ? "var(--success-500)" : "var(--danger-500)" }}
            >
              <Target size={28} color="white" />
            </div>
            <h2 className="text-2xl font-extrabold">
              {result.examResult!.passed ? "Oefenexamen gehaald!" : "Nog niet gehaald"}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
              {Math.round(result.examResult!.scorePct)}% goed ({result.correctCount}/{result.totalCount})
            </p>
            <p className="mt-3 text-xs px-3 py-2 rounded-xl" style={{ background: "var(--surface-muted)", color: "var(--foreground-muted)" }}>
              Let op: dit oefenexamen gehaald hebben betekent niet automatisch dat je klaar bent voor het
              echte examen. Bekijk je examengereedheid op het homescreen.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, var(--primary-400), var(--primary-600))" }}>
              <Sparkles size={28} color="white" />
            </div>
            <h2 className="text-2xl font-extrabold">Sessie voltooid</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
              {result.correctCount}/{result.totalCount} goed
            </p>
          </>
        )}

        <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
          <StatChip label={`+${result.xpEarned} XP`} color="var(--brand-500)" />
          {result.streak && <StatChip label={`🔥 ${result.streak.streak} dagen`} color="var(--gold-600)" />}
          {result.xp.leveledUp && <StatChip label={`Level ${result.xp.newLevel}!`} color="var(--primary-600)" />}
        </div>

        {result.dailyGoal?.justCompleted && (
          <p className="mt-4 font-extrabold" style={{ color: "var(--primary-600)" }}>
            🎯 Dagdoel voltooid!
          </p>
        )}

        {result.badges.length > 0 && (
          <div className="mt-5 space-y-2">
            {result.badges.map((b) => (
              <div key={b.name} className="flex items-center gap-3 p-3 rounded-2xl text-left" style={{ background: "color-mix(in srgb, var(--gold-500) 12%, transparent)" }}>
                <div className="icon-bubble shrink-0" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--gold-500)" }}>
                  <Award size={18} color="white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Nieuwe badge: {b.name}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {result.masteryAfter.length > 0 && (
          <div className="mt-6 space-y-3 text-left">
            {result.masteryAfter.map((m) => {
              const before = result.masterySnapshot[m.topicId] ?? 0;
              const up = m.level > before;
              return (
                <div key={m.topicId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">
                      {m.topicName} {up && <span style={{ color: "var(--success-600)" }}>↑</span>}
                    </span>
                    <span style={{ color: "var(--foreground-muted)" }}>
                      {m.insufficientData ? "Nog onvoldoende gegevens" : `Level ${m.level}/5`}
                    </span>
                  </div>
                  <ProgressBar value={m.level} max={5} color="var(--success-500)" height={8} />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2">
          <button className="btn-primary w-full" onClick={onRestartSameConfig}>
            Nog een sessie
          </button>
          <button className="btn-secondary w-full" onClick={() => router.push("/app")}>
            Terug naar home
          </button>
          {!isExam && (
            <Link href="/app/fouten" className="text-sm mt-2" style={{ color: "var(--foreground-muted)" }}>
              Bekijk je fouten
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="pill" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color, fontSize: "0.85rem" }}>
      {label}
    </span>
  );
}

function isExamPassed(result: SessionCompleteResult) {
  return Boolean(result.examResult?.passed);
}
