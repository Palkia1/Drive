import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Baseline hardening headers — previously relied entirely on Vercel/Next
// defaults, which set none of these. script-src allows 'unsafe-inline'
// because Next's own hydration payload is an inline <script> and this app
// has no nonce-issuing middleware yet; the meaningful gain here is blocking
// arbitrary *external* script/frame/object injection (the common real-world
// follow-on to a stored-content bug), not full inline-script XSS immunity.
// connect-src/img-src allow the actual third-party hosts this app talks to
// (Sentry ingest, PostHog — both via their npm SDKs, not a <script src>).
//
// Dev-only additions, confirmed necessary by actually loading the app under
// this CSP rather than assuming: Turbopack's dev client uses eval() for HMR
// module evaluation and source-map-based stack traces (React's own warning:
// "React will never use eval() in production mode", so this is scoped to
// dev only, not a production weakening), and the HMR websocket needs
// ws://localhost:* explicitly — 'self' does not implicitly cover the ws:
// scheme the way it covers same-origin https:.
const isDev = process.env.NODE_ENV !== "production";
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src 'self' https://*.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.posthog.com${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

// Only wraps the config (and pulls in the Sentry build plugin) when Sentry
// is actually configured — see instrumentation.ts for the matching runtime
// no-op when NEXT_PUBLIC_SENTRY_DSN is unset.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      // Source-map upload needs SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN;
      // without them the plugin just skips the upload rather than failing
      // the build, so this stays safe to leave unconfigured for now.
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : nextConfig;
