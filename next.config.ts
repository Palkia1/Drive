import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
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
