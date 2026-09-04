"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initAnalytics, identifyUser } from "@/lib/analytics";

/** Mounted once inside SessionProvider — initializes PostHog and identifies
 * the logged-in user so events can be tied back to an account. Renders
 * nothing; a no-op when NEXT_PUBLIC_POSTHOG_KEY isn't set. */
export function Analytics() {
  const { data: session } = useSession();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      identifyUser(session.user.id, { role: session.user.role });
    }
  }, [session?.user?.id, session?.user?.role]);

  return null;
}
