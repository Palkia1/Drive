import type { CapacitorConfig } from "@capacitor/cli";

// Rijklaar is a server-rendered Next.js app (server components, session
// cookies, a database) — not a static bundle — so Capacitor doesn't ship the
// app's files inside the APK. Instead it points the WebView at the app's
// live URL, same as opening it in a browser, just wrapped as an installable
// app. Update `server.url` once the app is deployed (e.g. to Vercel).
const config: CapacitorConfig = {
  appId: "nl.rijklaar.app",
  appName: "Rijklaar",
  webDir: "public",
  server: {
    // TODO: replace with the real production URL once deployed.
    url: "https://rijklaar.example.com",
    cleartext: false,
  },
};

export default config;
