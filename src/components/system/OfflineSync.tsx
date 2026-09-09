"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { flushAnswerQueue } from "@/lib/offlineQueue";

/** Mounted once app-wide: registers the offline app-shell service worker,
 * shows a small "you're offline" indicator, and syncs any queued answers
 * as soon as connectivity returns — regardless of which page the student
 * is on when that happens (see QuestionCard.tsx for where answers get
 * queued in the first place). */
export function OfflineSync() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only API (navigator.onLine) once on mount, not derived React state
    setOffline(!navigator.onLine);

    function goOnline() {
      setOffline(false);
      flushAnswerQueue();
    }
    function goOffline() {
      setOffline(true);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (navigator.onLine) flushAnswerQueue(); // pick up anything left over from a previous offline visit

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-white"
      style={{ background: "var(--foreground-muted)" }}
    >
      <WifiOff size={13} /> Je bent offline — voortgang wordt lokaal bewaard.
    </div>
  );
}
