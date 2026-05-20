import { SITE } from "@/lib/site";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-y opacity-[0.55]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-brand-50/70 via-white to-transparent"
      />

      <div className="container-page pt-16 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <div className="animate-fade-up">
              <span className="eyebrow">Built for manufacturers in India</span>
              <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.05] tracking-tightish text-slate-900 sm:text-5xl lg:text-[3.5rem]">
                Inventory and production tracking{" "}
                <span className="text-slate-500">that fits a real factory.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Operza replaces the Excel sheets, paper logs and WhatsApp
                groups your team uses to run raw materials, BOMs, production
                runs and finished goods — in one clean dashboard.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="/health-check" className="btn-primary">
                  Take Manufacturing Health Check
                  <ArrowRight />
                </a>
                <a
                  href={SITE.app}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Open app
                </a>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                60-second operational audit · No signup ·{" "}
                <a href="#contact" className="underline-offset-4 hover:underline">
                  Or book a demo
                </a>
              </p>

              <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <li className="inline-flex items-center gap-2">
                  <Tick /> No installation
                </li>
                <li className="inline-flex items-center gap-2">
                  <Tick /> Works on mobile
                </li>
                <li className="inline-flex items-center gap-2">
                  <Tick /> Setup in minutes
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-6">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Tick() {
  return (
    <svg
      className="h-4 w-4 text-slate-900"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function HeroDashboard() {
  const tiles = [
    { label: "Raw materials", value: "84", sub: "parts tracked" },
    { label: "Products", value: "12", sub: "with BOM" },
    { label: "Low stock", value: "3", sub: "needs reorder", warn: true },
    { label: "Finished units", value: "316", sub: "in stock" },
  ];
  const rows = [
    { name: "Wood Plank Pine 1x4", stock: "240 pcs", alertPct: 78 },
    { name: "Wood Screws M6", stock: "18 pcs", alertPct: 12, warn: true },
    { name: "Wood Glue 250ml", stock: "32 bottles", alertPct: 64 },
    { name: "Cotton Fabric Roll", stock: "90 m", alertPct: 60 },
  ];

  return (
    <div className="relative animate-fade-up">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-brand-100/40 via-white to-slate-100/40 blur-xl"
      />
      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Operza · Dashboard
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((t) => (
              <div
                key={t.label}
                className={`rounded-xl border p-3 ${
                  t.warn
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {t.label}
                </div>
                <div
                  className={`mt-1.5 text-xl font-semibold tracking-tight ${
                    t.warn ? "text-amber-700" : "text-slate-900"
                  }`}
                >
                  {t.value}
                </div>
                <div
                  className={`text-[11px] ${
                    t.warn ? "text-amber-700/80" : "text-slate-500"
                  }`}
                >
                  {t.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <span>Raw materials</span>
              <span>Stock level</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {r.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 sm:block">
                      <span
                        className={`block h-full rounded-full ${
                          r.warn ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${r.alertPct}%` }}
                      />
                    </span>
                    <span
                      className={`min-w-[72px] rounded-md px-2 py-0.5 text-right text-xs font-semibold ${
                        r.warn
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {r.stock}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
