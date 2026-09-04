"use client";

import posthog from "posthog-js";

// Inert without NEXT_PUBLIC_POSTHOG_KEY — same pattern as the Sentry DSN
// check in instrumentation.ts / instrumentation-client.ts, so analytics
// stays fully optional per environment.
let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}
