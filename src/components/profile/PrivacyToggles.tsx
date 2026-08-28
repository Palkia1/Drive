"use client";

import { useState } from "react";

type Flags = {
  showOnLeaderboard: boolean;
  shareXpWithFriends: boolean;
  shareStreakWithFriends: boolean;
  shareBadgesWithFriends: boolean;
  shareMasteryWithFriends: boolean;
};

const LABELS: Record<keyof Flags, string> = {
  showOnLeaderboard: "Zichtbaar op landelijk scoreboard",
  shareXpWithFriends: "XP zichtbaar voor vrienden",
  shareStreakWithFriends: "Streak zichtbaar voor vrienden",
  shareBadgesWithFriends: "Badges zichtbaar voor vrienden",
  shareMasteryWithFriends: "Voortgang per onderwerp zichtbaar voor vrienden",
};

export function PrivacyToggles({ initial }: { initial: Flags }) {
  const [flags, setFlags] = useState(initial);
  const [saving, setSaving] = useState<keyof Flags | null>(null);

  async function toggle(key: keyof Flags) {
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setSaving(key);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    }).catch(() => {});
    setSaving(null);
  }

  return (
    <div className="space-y-3">
      {(Object.keys(LABELS) as (keyof Flags)[]).map((key) => (
        <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm">{LABELS[key]}</span>
          <button
            type="button"
            role="switch"
            aria-checked={flags[key]}
            onClick={() => toggle(key)}
            disabled={saving === key}
            className="w-11 h-6 rounded-full relative shrink-0 transition"
            style={{ background: flags[key] ? "var(--brand-500)" : "var(--surface-muted)" }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: flags[key] ? 22 : 2 }}
            />
          </button>
        </label>
      ))}
    </div>
  );
}
