import * as Sentry from "@sentry/nextjs";

// Sentry DSNs aren't secret (safe to expose client-side), so one public env
// var covers server, edge and client init — see instrumentation-client.ts.
// Left empty, Sentry.init() no-ops instead of erroring, so this stays inert
// in any environment that hasn't set it (same pattern as the OAuth
// providers in src/lib/auth.ts).
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
