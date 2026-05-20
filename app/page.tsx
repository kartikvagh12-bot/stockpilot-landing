import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BlindSpots from "@/components/BlindSpots";
import HealthCheckCTA from "@/components/HealthCheckCTA";
import Workflow from "@/components/Workflow";
import Features from "@/components/Features";
import Screenshots from "@/components/Screenshots";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingAudit from "@/components/FloatingAudit";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BlindSpots />
        <HealthCheckCTA />
        <Workflow />
        <Features />
        <Screenshots />
        <FAQ />
        <FinalCTA />
        <Contact />
      </main>
      <Footer />
      <FloatingAudit />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: SITE.name,
            url: SITE.domain,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Inventory and production tracking for manufacturers.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />
    </>
  );
}
