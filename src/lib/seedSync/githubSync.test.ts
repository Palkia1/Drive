import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncQuestionEditToSeedSource } from "./githubSync";

const SAMPLE = `
const QUESTIONS: SeedQuestion[] = [
  {
    seedId: "sq-0001",
    topic: "voorrang",
    type: "SINGLE_CHOICE",
    difficulty: 1,
    prompt: "Origineel?",
    explanation: "Uitleg.",
    scene: { kind: "SINGLE_CHOICE", options: [], correctOptionId: "a" },
  },
];
`;

function b64(s: string) {
  return Buffer.from(s, "utf8").toString("base64");
}

describe("syncQuestionEditToSeedSource", () => {
  const originalToken = process.env.GITHUB_SYNC_TOKEN;

  beforeEach(() => {
    process.env.GITHUB_SYNC_TOKEN = "test-token";
  });
  afterEach(() => {
    process.env.GITHUB_SYNC_TOKEN = originalToken;
    vi.unstubAllGlobals();
  });

  it("skips with no-token when GITHUB_SYNC_TOKEN is unset, without any network call", async () => {
    delete process.env.GITHUB_SYNC_TOKEN;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await syncQuestionEditToSeedSource("sq-0001", { prompt: "x" }, "test");
    expect(result).toEqual({ status: "skipped", reason: "no-token" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips with no-seed-key when the question has none, without any network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await syncQuestionEditToSeedSource(null, { prompt: "x" }, "test");
    expect(result).toEqual({ status: "skipped", reason: "no-seed-key" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches the current file, patches it, and PUTs the new content with the same sha", async () => {
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        // GET
        return new Response(JSON.stringify({ content: b64(SAMPLE), sha: "abc123", encoding: "base64" }), { status: 200 });
      }
      // PUT
      const body = JSON.parse(String(init.body));
      expect(body.sha).toBe("abc123");
      expect(body.branch).toBe("claude/dutch-driving-theory-app-zfo07i");
      const decoded = Buffer.from(body.content, "base64").toString("utf8");
      expect(decoded).toContain('prompt: "Nieuwe vraag?"');
      return new Response(JSON.stringify({ commit: { html_url: "https://github.com/Palkia1/Drive/commit/deadbeef" } }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await syncQuestionEditToSeedSource("sq-0001", { prompt: "Nieuwe vraag?" }, "vraag aangepast");
    expect(result).toEqual({ status: "synced", commitUrl: "https://github.com/Palkia1/Drive/commit/deadbeef" });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("skips with not-found-in-source when no entry has the given seedId, without a PUT", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ content: b64(SAMPLE), sha: "abc123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const result = await syncQuestionEditToSeedSource("sq-9999", { prompt: "x" }, "test");
    expect(result).toEqual({ status: "skipped", reason: "not-found-in-source" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns a structured error instead of throwing when GitHub responds with an error status", async () => {
    const fetchSpy = vi.fn(async () => new Response("nope", { status: 401 }));
    vi.stubGlobal("fetch", fetchSpy);
    const result = await syncQuestionEditToSeedSource("sq-0001", { prompt: "x" }, "test");
    expect(result.status).toBe("error");
  });
});
