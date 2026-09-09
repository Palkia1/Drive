import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Nunito (rounded, heavy weights) stands in for Duolingo's "feather" display
// face; Nunito Sans (its geometric, non-rounded sibling) stands in for
// "duolingo-sans" body copy — same pairing the style guide itself suggests.
const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
  themeColor: "#58cc02",
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
