import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Nunito/Nunito Sans stand in for Duolingo's actual fonts — Feather Bold
// (headlines) and DIN Next Rounded (body/UI). Both real ones are proprietary
// (Feather Bold isn't licensable at all; DIN Next Rounded is a paid Monotype
// font), so these are the closest free Google Fonts equivalents — the same
// substitutes Duolingo's own style guide suggests.
const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rijklaar — theorie leren voor rijbewijs B",
  description:
    "Een moderne theorie-app voor rijscholen: korte oefensessies, interactieve verkeerssituaties en persoonlijke coaching richting je theorie-examen.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f7dff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${nunito.variable} ${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
