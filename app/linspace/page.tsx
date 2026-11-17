import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LinspaceHero from "@/components/LinspaceHero";
import LinspaceFocus from "@/components/LinspaceFocus";
import LinspaceStatus from "@/components/LinspaceStatus";
import Footer from "@/components/Footer";
import { LINSPACE, SITE } from "@/lib/site";

// Operza Linspace: the pre-launch page for a product in development.
//
// Founder choices for this release candidate: noindex, no early-access
// sign-up or waiting list, and a generic company contact route only. No
// structured data: a SoftwareApplication would describe software nobody can
// use yet.
const URL = `${SITE.domain}${LINSPACE.path}`;

const DESCRIPTION =
  "Operza Linspace is in development: software Operza is designing for construction drawings, quantity takeoff, bills of quantities and cost estimation. Not yet available.";

export const metadata: Metadata = {
  title: "Operza Linspace (in development)",
  description: DESCRIPTION,
  alternates: { canonical: URL },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: URL,
    siteName: "Operza",
    title: "Operza Linspace (in development) | Operza",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Operza Linspace (in development) | Operza",
    description: DESCRIPTION,
  },
};

export default function LinspacePage() {
  return (
    <>
      <Navbar />
      <main>
        <LinspaceHero />
        <LinspaceFocus />
        <LinspaceStatus />
      </main>
      <Footer />
    </>
  );
}
