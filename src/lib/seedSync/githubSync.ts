import { patchQuestionBySeedId, type SeedQuestionPatch } from "./patchSeedSource";

const REPO_OWNER = "Palkia1";
const REPO_NAME = "Drive";
const REPO_BRANCH = "claude/dutch-driving-theory-app-zfo07i";
const SEED_FILE_PATH = "prisma/seed.ts";

function apiBase() {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${SEED_FILE_PATH}`;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Result of attempting to sync a beta-tester's edit back into prisma/seed.ts
 * so it survives the next reseed. `skipped` covers every expected reason the
 * live DB edit still applies but source wasn't touched (no token configured,
 * this question has no seedId, or nothing actually changed). */
export type SyncResult =
  | { status: "synced"; commitUrl: string }
  | { status: "skipped"; reason: "no-token" | "no-seed-key" | "not-found-in-source" | "no-change" }
  | { status: "error"; message: string };

/** Writes a beta-tester's live edit straight back to prisma/seed.ts on
 * GitHub, as a real commit on the app's working branch — so the change
 * survives the next `prisma/seed.ts` reseed instead of being silently wiped
 * by it. Requires GITHUB_SYNC_TOKEN (a fine-grained PAT scoped to this repo
 * with Contents: read/write) — without it this quietly no-ops, since the
 * live database edit already succeeded regardless. */
export async function syncQuestionEditToSeedSource(
  seedKey: string | null,
  patch: SeedQuestionPatch,
  commitSummary: string,
  tester?: { name?: string | null; email?: string | null }
): Promise<SyncResult> {
  const token = process.env.GITHUB_SYNC_TOKEN;
  if (!token) return { status: "skipped", reason: "no-token" };
  if (!seedKey) return { status: "skipped", reason: "no-seed-key" };

  try {
    const getRes = await fetch(`${apiBase()}?ref=${REPO_BRANCH}`, { headers: authHeaders(token) });
    if (!getRes.ok) return { status: "error", message: `GitHub GET ${getRes.status}: ${await getRes.text()}` };
    const file = (await getRes.json()) as { content: string; sha: string; encoding: string };
    const currentText = Buffer.from(file.content, "base64").toString("utf8");

    const { text: newText, found, changed } = patchQuestionBySeedId(currentText, seedKey, patch);
    if (!found) return { status: "skipped", reason: "not-found-in-source" };
    if (!changed) return { status: "skipped", reason: "no-change" };

    const putRes = await fetch(apiBase(), {
      method: "PUT",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Beta-tester: ${commitSummary} (${seedKey})${tester?.name ? `\n\nDoor ${tester.name} via het feedbackportaal.` : ""}`,
        content: Buffer.from(newText, "utf8").toString("base64"),
        sha: file.sha,
        branch: REPO_BRANCH,
        ...(tester?.name && tester?.email
          ? { author: { name: tester.name, email: tester.email }, committer: { name: tester.name, email: tester.email } }
          : {}),
      }),
    });
    if (!putRes.ok) return { status: "error", message: `GitHub PUT ${putRes.status}: ${await putRes.text()}` };
    const putBody = (await putRes.json()) as { commit?: { html_url?: string } };
    return { status: "synced", commitUrl: putBody.commit?.html_url ?? "" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
