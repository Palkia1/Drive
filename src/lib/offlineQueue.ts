"use client";

import type { SubmittedAnswer } from "@/lib/answers";

const STORAGE_KEY = "rijklaar:offline-answer-queue";

export type QueuedAnswer = {
  sessionId: string;
  questionId: string;
  answer: SubmittedAnswer;
  timeMs: number;
  queuedAt: number;
};

function readQueue(): QueuedAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAnswer[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAnswer[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable (private browsing) — the entry still
    // lives in the caller's own component state for this page load, it
    // just won't survive a reload. Nothing more we can do here.
  }
}

export function enqueueAnswer(entry: Omit<QueuedAnswer, "queuedAt">) {
  const queue = readQueue();
  queue.push({ ...entry, queuedAt: Date.now() });
  writeQueue(queue);
}

export function getQueueLength(): number {
  return readQueue().length;
}

/** Replays queued answers in the order they were recorded, one at a time.
 * Stops at the first entry that fails because we're still offline (leaving
 * it and everything after it queued for the next attempt). Any actual
 * server response — including a 409 for "already answered", which just
 * means an earlier attempt already got through — counts as resolved. */
export async function flushAnswerQueue(): Promise<void> {
  let queue = readQueue();
  while (queue.length > 0) {
    const entry = queue[0];
    try {
      await fetch(`/api/sessions/${entry.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: entry.questionId, answer: entry.answer, timeMs: entry.timeMs }),
      });
    } catch {
      return; // still offline (or the network just hiccuped) — try again next time
    }
    queue = queue.slice(1);
    writeQueue(queue);
  }
}
