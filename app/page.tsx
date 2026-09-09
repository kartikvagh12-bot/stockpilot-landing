import Navbar from "@/components/Navbar";
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
import { SITE } from "@/lib/site";
import { faqJsonLd } from "@/lib/faq";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
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
              name: SITE.name,
              url: SITE.domain,
              applicationCategory: "BusinessApplication",
              applicationSubCategory:
                "Manufacturing and accounting software",
              operatingSystem: "Web",
              description:
                "Manufacturing software for Indian factories. Materials, production, packing and dispatch on the floor. Invoices, bills, payments and statements in the books.",
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE.name,
              url: SITE.domain,
              logo: `${SITE.domain}/operza-logo.png`,
              email: SITE.email,
            },
            // Built from lib/faq.ts, the same array the visible FAQ renders,
            // so the structured data cannot drift from the page.
            faqJsonLd(),
          ]),
        }}
      />
    </>
  );
}
