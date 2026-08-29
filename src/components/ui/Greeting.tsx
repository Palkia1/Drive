"use client";

import { useEffect, useState } from "react";

function greetingFor(hour: number) {
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

/**
 * Client component so this reads the *visitor's* clock — the Home page
 * around it is a server component, and computing this server-side used the
 * server's timezone (production runs in the US), showing "Goedemorgen" to
 * Dutch users well into the afternoon.
 */
export function Greeting() {
  // Neutral on the server-rendered/first-hydrated pass to avoid a
  // mismatch, then swapped for the real local greeting after mount.
  const [text, setText] = useState("Hallo");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- local time is only knowable client-side, not derivable from props/state
    setText(greetingFor(new Date().getHours()));
  }, []);

  return <>{text}</>;
}
