import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://www.operza.in";

// Positioning lock (2026-09): Operza is manufacturing software for Indian
// factories that runs the shop floor and the business books. The connected
// floor-plus-books behaviour belongs to Operza Complete specifically, so the
// shared metadata below states the scope without claiming the connection for
// every workspace. Product truth: operza-app @ c3580741.
const TITLE =
  "Operza: manufacturing software that runs your factory and your books";

const DESCRIPTION =
  "Manufacturing software for Indian factories. Track materials, production, packing and dispatch, and keep the invoices, bills, payments and books that go with them.";

const SOCIAL_TITLE = "Operza: run your factory and your books in one system";

const SOCIAL_DESCRIPTION =
  "Manufacturing software for Indian factories. Materials, production, packing and dispatch on the floor. Invoices, bills, payments and statements in the books. Exports for TallyPrime.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Operza",
  },
  description: DESCRIPTION,
  keywords: [
    "manufacturing software India",
    "factory management software",
    "production and inventory software",
    "BOM software",
    "manufacturing accounting software",
    "inventory and accounting software India",
    "TallyPrime export",
    "MSME manufacturing software",
    "product costing software",
    "manufacturing ERP India",
    "Operza",
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
      </head>
      <body className="bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
