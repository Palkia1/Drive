"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { DemoNoticeModal } from "@/components/ui/DemoNoticeModal";
import { Analytics } from "@/components/analytics/Analytics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        {children}
        <DemoNoticeModal />
        <Analytics />
      </SessionProvider>
    </ThemeProvider>
  );
}
