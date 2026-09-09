import Link from "next/link";
import InteractiveProductionDemo from "@/components/InteractiveProductionDemo";

// Wrapper that gives the demo its new framing and its single CTA. The demo's
// own behaviour is untouched: same state machine, same tiers, same outcomes.
//
// The demo is a bespoke client-side simulation. It shares no code with the
// product, so nothing here says it runs real logic.

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
