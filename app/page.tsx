import Navbar from "@/components/Navbar";
import CompanyHero from "@/components/CompanyHero";
import WhatWeBuild from "@/components/WhatWeBuild";
import ShiftShowcase from "@/components/ShiftShowcase";
import LinspacePreview from "@/components/LinspacePreview";
import Approach from "@/components/Approach";
import CompanyContact from "@/components/CompanyContact";
import Footer from "@/components/Footer";
import LegacyAnchorForward from "@/components/LegacyAnchorForward";
import { SITE } from "@/lib/site";
import { isAssistantAvailable } from "@/lib/assistant/runtime/config";

// The Operza company homepage (Founder direction, 2026-11-17). Operza is the
// parent brand; Operza Shift and Operza Linspace are introduced as its
// products. The manufacturing story that used to live here is on /shift, and
// old links to its sections are forwarded there by LegacyAnchorForward.
//
// Metadata is the root layout's company default. Structured data describes
// the company only: the SoftwareApplication belongs to /shift, and Operza
// Linspace gets none because it is not released.

export default function HomePage() {
  // Server-side and fail-closed: false unless every assistant requirement is
  // configured for this deployment, in which case the input is not rendered.
  const assistant = isAssistantAvailable();
  return (
    <>
      <LegacyAnchorForward />
      <Navbar />
      <main>
        <CompanyHero assistant={assistant} />
        <WhatWeBuild />
        <ShiftShowcase />
        <LinspacePreview />
        <Approach />
        <CompanyContact />
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              // The public brand is the name; the registered company is the
              // legalName (approved decision 2).
              name: SITE.name,
              legalName: SITE.legalName,
              url: SITE.domain,
              logo: `${SITE.domain}/operza-logo.png`,
              email: SITE.email,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE.name,
              url: SITE.domain,
            },
          ]),
        }}
      />
    </>
  );
}
