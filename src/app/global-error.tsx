"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="nl">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Er ging iets mis</h1>
            <p style={{ fontSize: 14, color: "#666" }}>
              Sorry, er is een onverwachte fout opgetreden. Probeer de pagina te verversen.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
