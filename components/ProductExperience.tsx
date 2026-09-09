import Link from "next/link";
import InteractiveProductionDemo from "@/components/InteractiveProductionDemo";

// Wrapper that supplies the framing and the single CTA around the demo.
//
// The simulation itself keeps its four production tiers: 25 healthy, 50 one
// material low, 100 two low, and 200 blocked with nothing posted. What it no
// longer has is the second half it used to end in, a "Purchasing workspace"
// with supplier names, suggested reorder quantities and replenishment timing.
// Operza has Purchases and Suppliers but no reorder-suggestion surface, so
// that half described a feature that does not exist and was removed.
//
// It remains a bespoke client-side simulation sharing no code with operza-app,
// so nothing here claims it runs real product logic.

export default function ProductExperience() {
  return (
    <section className="section border-t border-slate-200/70 bg-slate-50/60">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">See it work</span>
          <h2 className="h-section">Try a production run here.</h2>
          <p className="p-section">
            A simplified interactive example of one Operza Factory workflow.
            Pick a batch size and watch Operza check the materials, deduct them
            and post the finished units.
          </p>
        </div>
      </div>

      <InteractiveProductionDemo />

      <div className="container-page mt-14 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Not sure where your operation stands? The Manufacturing Health Check
          is eight questions and takes about a minute. No signup.{" "}
          <Link
            href="/health-check"
            className="font-medium text-slate-900 underline underline-offset-4 hover:text-brand-700"
          >
            Take the Health Check
          </Link>
        </p>
        <a href="#contact" className="btn-primary shrink-0">
          Book a demo
        </a>
      </div>
    </section>
  );
}
