import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://stockpilot-landing.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Operza — Inventory and production tracking for small manufacturers",
    template: "%s | Operza",
  },
  description:
    "Inventory and production tracking for small manufacturers. Manage raw materials, BOMs, production runs and finished goods — without spreadsheets.",
  keywords: [
    "inventory software India",
    "production tracking software",
    "raw material management",
    "BOM software",
    "small manufacturer software",
    "manufacturing inventory",
    "MSME inventory software",
    "stock management software",
    "factory inventory app",
    "Operza",
  ],
  authors: [{ name: "Operza" }],
  creator: "Operza",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "Operza",
    title: "Operza — Inventory and production tracking for small manufacturers",
    description:
      "Inventory and production tracking for small manufacturers. Manage raw materials, BOMs, production runs and finished goods — without spreadsheets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Operza — Inventory and production tracking for small manufacturers",
    description:
      "Inventory and production tracking for small manufacturers. Manage raw materials, BOMs, production runs and finished goods — without spreadsheets.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport = {
  themeColor: "#2c43ed",
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
