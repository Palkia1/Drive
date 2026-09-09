"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { DemoNoticeModal } from "@/components/ui/DemoNoticeModal";
import { Analytics } from "@/components/analytics/Analytics";
import { OfflineSync } from "@/components/system/OfflineSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        {children}
        <DemoNoticeModal />
        <Analytics />
        <OfflineSync />
      </SessionProvider>
    </ThemeProvider>
  );
}
