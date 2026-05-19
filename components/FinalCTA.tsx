import { SITE } from "@/lib/site";

export default function FinalCTA() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-white sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid opacity-[0.08]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
          />

          <div className="relative grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live now
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Run your factory on Operza this week.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Open the app, add your parts and products, and start logging
                production today. No installation, no credit card, works on a
                phone.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Launch app
                <ArrowUpRight />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M6.5 5.5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 11-2 0V7.914l-6.793 6.793a1 1 0 01-1.414-1.414L11.086 6.5H7.5a1 1 0 01-1-1z" />
    </svg>
  );
}
