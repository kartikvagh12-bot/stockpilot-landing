import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import OperzaIntro from "@/components/OperzaIntro";
import Hero from "@/components/Hero";
import ProductExperience from "@/components/ProductExperience";
import Plans from "@/components/Plans";
import RunYourFactory from "@/components/RunYourFactory";
import Costing from "@/components/Costing";
import RunYourBooks from "@/components/RunYourBooks";
import CompleteSection from "@/components/CompleteSection";
import HealthCheckCallout from "@/components/HealthCheckCallout";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { SHIFT, SITE } from "@/lib/site";
import { faqJsonLd } from "@/lib/faq";

// Operza Shift: the manufacturing product page. This is the story the
// homepage told before the multi-product cutover, moved here whole: the
// pearl-relief introduction, the founder-set hero, the interactive examples,
// the plans, the product sections, the Health Check, the FAQ and the working
// demo-request form.
//
// Positioning (product truth: operza-app): manufacturing software for Indian
// factories that runs the shop floor and the business books. The connected
// floor-plus-books behaviour belongs to Operza Complete specifically, so the
// metadata states the scope without claiming the connection for every plan.
const URL = `${SITE.domain}${SHIFT.path}`;

const TITLE =
  "Operza Shift: manufacturing software that runs your factory and your books";

const DESCRIPTION =
  "Manufacturing software for Indian factories. Track materials, production, packing and dispatch, and keep the invoices, bills, payments and books that go with them.";

const SOCIAL_TITLE = "Operza Shift: run your factory and your books in one system";

const SOCIAL_DESCRIPTION =
  "Manufacturing software for Indian factories. Materials, production, packing and dispatch on the floor. Invoices, bills, payments and statements in the books. Exports for TallyPrime.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "Operza Shift",
    "manufacturing software India",
    "factory management software",
    "production and inventory software",
    "BOM software",
    "manufacturing accounting software",
    "inventory and accounting software India",
    "TallyPrime export",
    "MSME manufacturing software",
    "product costing software",
  ],
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: URL,
    siteName: "Operza",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
  },
};

export default function ShiftPage() {
  return (
    <>
      <Navbar />
      <main>
        <OperzaIntro />
        <Hero />
        <ProductExperience />
        <Plans />
        <RunYourFactory />
        <Costing />
        <RunYourBooks />
        <CompleteSection />
        <HealthCheckCallout />
        <FAQ />
        <Contact />
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              // The product, named from the registry. The company is the
              // publisher, under its public brand.
              name: SHIFT.name,
              url: URL,
              applicationCategory: "BusinessApplication",
              applicationSubCategory:
                "Manufacturing and accounting software",
              operatingSystem: "Web",
              description:
                "Manufacturing software for Indian factories. Materials, production, packing and dispatch on the floor. Invoices, bills, payments and statements in the books.",
              publisher: {
                "@type": "Organization",
                name: SITE.name,
                url: SITE.domain,
              },
            },
            // Built from lib/faq.ts, the same array the visible FAQ on this
            // page renders, so the structured data cannot drift from it.
            faqJsonLd(),
          ]),
        }}
      />
    </>
  );
}
