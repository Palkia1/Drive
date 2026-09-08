"use client";

import type { PostHog } from "posthog-js";

// Inert without NEXT_PUBLIC_POSTHOG_KEY — same pattern as the Sentry DSN
// check in instrumentation.ts / instrumentation-client.ts, so analytics
// stays fully optional per environment. posthog-js is lazy-imported (not a
// top-level import) so its ~30-40KB doesn't ship in the shared bundle on
// every route when the key is unset.
let posthogInstance: PostHog | null = null;
let initialized = false;

export async function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    persistence: "localStorage+cookie",
  });
  posthogInstance = posthog;
  initialized = true;
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  posthogInstance?.capture(event, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  posthogInstance?.identify(userId, properties);
}
