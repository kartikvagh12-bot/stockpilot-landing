import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BotIdClient } from "botid/client";
import { isAssistantAvailable } from "@/lib/assistant/runtime/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://www.operza.in";

// Company-level defaults. Operza is the parent brand (Founder direction,
// 2026-11-17): Operza Shift serves manufacturing today and Operza Linspace,
// for construction, is in development. Product pages set their own title,
// description, canonical URL and social card; these defaults describe the
// company and are what the homepage uses.
const TITLE = "Operza: software for complex work";

const DESCRIPTION =
  "Operza builds software for complex business workflows. Operza Shift runs manufacturing operations and accounting today, and Operza Linspace, for construction, is in development.";

const SOCIAL_TITLE = "Operza: Complex work. Clearer possibilities.";

const SOCIAL_DESCRIPTION =
  "Operza builds software for complex business workflows. Our first product serves manufacturing, and we are developing our next for construction.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Operza",
  },
  description: DESCRIPTION,
  keywords: [
    "Operza",
    "Operza Shift",
    "Operza Linspace",
    "business workflow software",
    "manufacturing software India",
    "manufacturing accounting software",
  ],
  authors: [{ name: "Operza" }],
  creator: "Operza",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Operza",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon-512.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Vercel BotID marks requests to the assistant endpoint so the server
            can tell people from bots. Mounted only when the assistant is
            configured, so pages are unchanged while it is off. */}
        {isAssistantAvailable() && (
          <BotIdClient protect={[{ path: "/api/assistant", method: "POST" }]} />
        )}
      </head>
      <body className="bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
