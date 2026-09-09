"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, UserPlus, Trophy, Award, Users, Swords, Plus, Clock } from "lucide-react";
import { GlobeStarIcon } from "@/components/icons/GlobeStarIcon";
import { StreakFlameIcon } from "@/components/icons/StreakFlameIcon";
import type { FriendView } from "@/lib/friendsData";
import type { LeaderboardRow } from "@/lib/leaderboard";
import type { ChallengeView } from "@/lib/challenges";

type Props = {
  friendCode: string;
  friends: FriendView[];
  pending: { id: string; username: string }[];
  leaderboard: { top: LeaderboardRow[]; selfRow?: LeaderboardRow; selfInTop: boolean; totalRanked: number };
  challenges: ChallengeView[];
  topics: { id: string; name: string }[];
};

export function SociaalClient({ friendCode, friends, pending, leaderboard, challenges, topics }: Props) {
  const [tab, setTab] = useState<"vrienden" | "ranglijst" | "uitdagingen">("vrienden");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Sociaal</h1>
      <div className="flex gap-2 mb-4">
        <TabButton active={tab === "vrienden"} onClick={() => setTab("vrienden")} label="Vrienden" icon={Users} />
        <TabButton active={tab === "uitdagingen"} onClick={() => setTab("uitdagingen")} label="Uitdagingen" icon={Swords} />
        <TabButton active={tab === "ranglijst"} onClick={() => setTab("ranglijst")} label="Landelijk" icon={GlobeStarIcon} />
      </div>

      {tab === "vrienden" && <VriendenTab friendCode={friendCode} friends={friends} pending={pending} />}
      {tab === "uitdagingen" && <UitdagingenTab challenges={challenges} topics={topics} hasFriends={friends.length > 0} />}
      {tab === "ranglijst" && <RanglijstTab leaderboard={leaderboard} />}
    </div>
  );
}

function VriendenTab({
  friendCode,
  friends,
  pending,
}: {
  friendCode: string;
  friends: FriendView[];
  pending: { id: string; username: string }[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendCode: code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      return;
    }
    setMessage(`Verzoek verstuurd naar ${data.addedUsername}.`);
    setCode("");
    router.refresh();
  }

  async function respond(id: string, accept: boolean) {
    await fetch(`/api/friends/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          Jouw vriendschapscode
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold tracking-wider" style={{ color: "var(--brand-600)" }}>
            {friendCode}
          </span>
          <button
            type="button"
            aria-label="Kopieer code"
            onClick={() => navigator.clipboard?.writeText(friendCode)}
            style={{ color: "var(--foreground-muted)" }}
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      <form onSubmit={addFriend} className="card p-4">
        <p className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <UserPlus size={16} /> Vriend toevoegen
        </p>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Vriendschapscode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button type="submit" disabled={busy || !code} className="btn-primary shrink-0">
            Voeg toe
          </button>
        </div>
        {error && (
          <p className="text-sm mt-2" style={{ color: "var(--danger-500)" }}>
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm mt-2" style={{ color: "var(--success-600)" }}>
            {message}
          </p>
        )}
      </form>

      {pending.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Verzoeken</p>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="card p-3 flex items-center justify-between">
                <span className="font-medium text-sm">{p.username}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => respond(p.id, false)}>
                    Weiger
                  </button>
                  <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={() => respond(p.id, true)}>
                    Accepteer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold mb-2">Vrienden ({friends.length})</p>
        {friends.length === 0 ? (
          <div className="card p-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
            Nog geen vrienden. Deel je code hierboven!
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.friendshipId} className="card p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{f.username}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                    Level {f.level}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                  {f.streak !== null && (
                    <span className="flex items-center gap-1">
                      <StreakFlameIcon size={14} color="var(--accent-500)" /> {f.streak}
                    </span>
                  )}
                  {f.xp !== null && <span>{f.xp} XP</span>}
                  {f.badgeCount !== null && (
                    <span className="flex items-center gap-1">
                      <Award size={14} style={{ color: "var(--success-500)" }} /> {f.badgeCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DURATION_OPTIONS = [
  { hours: 24, label: "Vandaag" },
  { hours: 24 * 7, label: "Deze week" },
  { hours: 24 * 30, label: "Deze maand" },
];

function UitdagingenTab({
  challenges,
  topics,
  hasFriends,
}: {
  challenges: ChallengeView[];
  topics: { id: string; name: string }[];
  hasFriends: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [metric, setMetric] = useState<"xp" | "topic_accuracy">("xp");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric, topicId: metric === "topic_accuracy" ? topicId : null, label, durationHours }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      return;
    }
    setLabel("");
    setShowForm(false);
    router.refresh();
  }

  async function join(id: string) {
    await fetch(`/api/challenges/${id}/join`, { method: "POST" });
    router.refresh();
  }

  const active = challenges.filter((c) => !c.isEnded);
  const ended = challenges.filter((c) => c.isEnded);

  return (
    <div className="space-y-5">
      {!hasFriends && (
        <div className="card p-4 text-sm" style={{ color: "var(--foreground-muted)" }}>
          Voeg eerst vrienden toe bij het tabblad &ldquo;Vrienden&rdquo; — een uitdaging deel je met hen.
        </div>
      )}

      {showForm ? (
        <form onSubmit={create} className="card p-4 space-y-3">
          <p className="font-semibold text-sm">Nieuwe uitdaging</p>
          <input
            className="input"
            placeholder="Naam, bijv. 'Wie haalt de meeste XP?'"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            required
          />
          <div className="flex gap-2">
            <select className="input" value={metric} onChange={(e) => setMetric(e.target.value as "xp" | "topic_accuracy")}>
              <option value="xp">Meeste XP</option>
              <option value="topic_accuracy">Hoogste score op onderwerp</option>
            </select>
            <select className="input" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}>
              {DURATION_OPTIONS.map((o) => (
                <option key={o.hours} value={o.hours}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {metric === "topic_accuracy" && (
            <select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)} required>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {error && (
            <p className="text-sm" style={{ color: "var(--danger-500)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              Aanmaken
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Annuleren
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-primary w-full flex items-center justify-center gap-1.5" onClick={() => setShowForm(true)} disabled={!hasFriends}>
          <Plus size={16} /> Nieuwe uitdaging
        </button>
      )}

      {active.length === 0 && ended.length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
          Nog geen uitdagingen. Start er een met je vrienden!
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onJoin={() => join(c.id)} />
          ))}
        </div>
      )}

      {ended.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>
            Afgelopen
          </p>
          <div className="space-y-3 opacity-70">
            {ended.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => join(c.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge, onJoin }: { challenge: ChallengeView; onJoin: () => void }) {
  const metricLabel = challenge.metric === "xp" ? "XP" : `${challenge.topicName ?? "onderwerp"} — score`;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-sm">{challenge.label}</p>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--foreground-muted)" }}>
            <Clock size={12} />
            {challenge.isEnded ? "Afgelopen" : `Tot ${new Date(challenge.endsAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`}
            {" · "}
            {metricLabel}
          </p>
        </div>
        {challenge.canJoin && (
          <button type="button" className="btn-primary !px-3 !py-1.5 text-sm shrink-0" onClick={onJoin}>
            Meedoen
          </button>
        )}
      </div>
      {challenge.standings.length > 0 && (
        <div className="space-y-1">
          {challenge.standings.map((s, i) => (
            <div
              key={s.studentId}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm"
              style={{ background: s.isSelf ? "var(--brand-50)" : "transparent" }}
            >
              <span className="w-5 text-center font-bold text-xs" style={{ color: i === 0 ? "var(--accent-600)" : "var(--foreground-muted)" }}>
                {i + 1}
              </span>
              <span className="flex-1 font-medium">{s.username}</span>
              <span className="font-semibold text-xs" style={{ color: "var(--brand-600)" }}>
                {challenge.metric === "xp" ? `${s.value} XP` : `${s.value}% (${s.attempts}x)`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RanglijstTab({ leaderboard }: { leaderboard: Props["leaderboard"] }) {
  if (!leaderboard.selfRow) {
    return (
      <div className="card p-6 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
        Je bent niet zichtbaar op het landelijke scoreboard. Zet dit aan bij je profielinstellingen om mee te
        doen.
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
        Reset elke dag om middernacht — gebaseerd op XP verdiend vandaag.
      </p>
      <div className="space-y-1.5">
        {leaderboard.top.map((row) => (
          <div
            key={row.studentId}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: row.isSelf ? "var(--brand-50)" : "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="w-7 text-center font-bold text-sm" style={{ color: row.rank <= 3 ? "var(--accent-600)" : "var(--foreground-muted)" }}>
              {row.rank <= 3 ? <Trophy size={16} className="inline" /> : row.rank}
            </span>
            <span className="flex-1 font-medium text-sm">{row.username}</span>
            <span className="text-sm font-semibold" style={{ color: "var(--brand-600)" }}>
              {row.xpToday.toLocaleString("nl-NL")} XP
            </span>
          </div>
        ))}
        {!leaderboard.selfInTop && leaderboard.selfRow && (
          <>
            <div className="text-center text-xs py-1" style={{ color: "var(--foreground-muted)" }}>
              ···
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--brand-50)", border: "1px solid var(--border)" }}>
              <span className="w-7 text-center font-bold text-sm" style={{ color: "var(--foreground-muted)" }}>
                {leaderboard.selfRow.rank}
              </span>
              <span className="flex-1 font-medium text-sm">{leaderboard.selfRow.username}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--brand-600)" }}>
                {leaderboard.selfRow.xpToday.toLocaleString("nl-NL")} XP
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5"
      style={{
        background: active ? "var(--brand-500)" : "var(--surface-muted)",
        color: active ? "white" : "var(--foreground-muted)",
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
