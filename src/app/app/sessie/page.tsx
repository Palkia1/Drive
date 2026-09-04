"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuestionCard, type ClientQuestion } from "@/components/practice/QuestionCard";
import { SessionResults, type SessionCompleteResult } from "@/components/practice/SessionResults";
import type { SubmittedAnswer } from "@/lib/answers";
import { captureEvent } from "@/lib/analytics";

type Phase = "loading" | "running" | "completing" | "done" | "error";

function SessieRunner() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") ?? "QUICK";
  const topicsParam = params.get("topics") ?? "";
  const topicIds = topicsParam.split(",").filter(Boolean);

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [masterySnapshot, setMasterySnapshot] = useState<Record<string, number>>({});
  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<SessionCompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guards against a stale response clobbering newer state — matters under
  // React Strict Mode's double-invoked effects in dev, and protects against
  // any real double-fire (fast remount, rapid "nog een sessie" taps).
  const requestId = useRef(0);

  const startSession = useCallback(async () => {
    const myRequestId = ++requestId.current;
    setPhase("loading");
    setIndex(0);
    setResult(null);
    const ids = topicsParam.split(",").filter(Boolean);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, topicIds: ids }),
    });
    const data = await res.json();
    if (myRequestId !== requestId.current) return; // a newer call already started

    if (!res.ok) {
      setError(data.error ?? "Kon geen sessie starten.");
      setPhase("error");
      return;
    }
    setSessionId(data.sessionId);
    setQuestions(data.questions);
    setMasterySnapshot(data.masterySnapshot ?? {});
    setSavedQuestionIds(data.savedQuestionIds ?? []);
    setPhase("running");
  }, [mode, topicsParam]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern; the resets below just seed the loading UI before the request resolves.
    startSession();
  }, [startSession]);

  async function handleAnswered(_answer: SubmittedAnswer, isCorrect: boolean) {
    const question = questions[index];
    captureEvent("question_answered", {
      topicId: question?.topicId,
      difficulty: question?.difficulty,
      correct: isCorrect,
      mode,
    });
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      await finishSession();
    }
  }

  async function finishSession() {
    setPhase("completing");
    const res = await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST" });
    const data = await res.json();
    setResult({ ...data, masterySnapshot });
    setPhase("done");
    captureEvent(mode === "EXAM" ? "exam_completed" : "session_completed", {
      mode,
      questionCount: questions.length,
      correctCount: data.correctCount,
      xpEarned: data.xpEarned,
    });
  }

  if (phase === "loading") {
    return <CenteredMessage text="Sessie voorbereiden..." />;
  }
  if (phase === "error") {
    return (
      <div className="text-center py-16">
        <p style={{ color: "var(--danger-500)" }}>{error}</p>
        <button className="btn-secondary mt-4" onClick={() => router.push("/app/oefenen")}>
          Terug
        </button>
      </div>
    );
  }
  if (phase === "completing") {
    return <CenteredMessage text="Resultaat berekenen..." />;
  }
  if (phase === "done" && result) {
    return (
      <SessionResults
        result={result}
        onRestartSameConfig={() => {
          router.replace(`/app/sessie?mode=${mode}&topics=${topicIds.join(",")}&_=${Date.now()}`);
          startSession();
        }}
      />
    );
  }

  const isExam = mode === "EXAM";
  const question = questions[index];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push("/app")} aria-label="Sluiten" style={{ color: "var(--foreground-muted)" }}>
          <X size={22} />
        </button>
        <ProgressBar value={index} max={questions.length} color={isExam ? "var(--foreground-muted)" : "var(--brand-500)"} />
        <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--foreground-muted)" }}>
          {index + 1}/{questions.length}
        </span>
      </div>
      {isExam && (
        <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-center" style={{ color: "var(--foreground-muted)" }}>
          Examenmodus — geen tussentijdse feedback
        </p>
      )}
      {question && (
        <QuestionCard
          key={question.id}
          question={question}
          sessionId={sessionId!}
          isExam={isExam}
          initiallySaved={savedQuestionIds.includes(question.id)}
          onAnswered={handleAnswered}
        />
      )}
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="py-24 text-center" style={{ color: "var(--foreground-muted)" }}>
      {text}
    </div>
  );
}

export default function SessiePage() {
  return (
    <Suspense fallback={<CenteredMessage text="Laden..." />}>
      <SessieRunner />
    </Suspense>
  );
}
