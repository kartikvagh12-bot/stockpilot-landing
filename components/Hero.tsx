export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl"
      >
        <div
          className="relative left-1/2 aspect-[1155/678] w-[60rem] -translate-x-1/2 bg-gradient-to-tr from-brand-300 to-brand-500 opacity-25"
          style={{
            clipPath:
              "polygon(74% 44%, 100% 61%, 97% 26%, 85% 0%, 80% 2%, 73% 32%, 60% 62%, 52% 68%, 47% 58%, 45% 34%, 27% 76%, 0% 64%, 17% 100%, 27% 76%, 76% 97%, 74% 44%)",
          }}
        />
      </div>

      <div className="container-page section pt-12 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="animate-fade-up">
              <span className="eyebrow">Built for manufacturers in India</span>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Stop tracking inventory{" "}
                <span className="text-brand-600">on Excel sheets.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Inventory and production tracking for manufacturers.
                Manage raw materials, BOMs, production runs and finished
                goods from one simple dashboard — on any device.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#contact" className="btn-primary">
                  Try Demo
                  <svg
                    className="ml-2 h-4 w-4"
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
                </a>
                <a href="#contact" className="btn-secondary">
                  Book Demo
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <CheckIcon /> No installation
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckIcon /> Works on mobile
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckIcon /> Setup in minutes
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-brand-600"
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

function HeroDashboard() {
  const tiles = [
    { label: "Total Parts", value: "84" },
    { label: "Products", value: "12" },
    { label: "Low Stock", value: "3", warn: true },
    { label: "Finished Units", value: "316" },
  ];
  const rows = [
    { name: "Wood Plank Pine", stock: 240, alert: 50 },
    { name: "Wood Screws M6", stock: 18, alert: 100, warn: true },
    { name: "Wood Glue 250ml", stock: 32, alert: 10 },
    { name: "Cotton Fabric", stock: 90, alert: 25 },
  ];

  return (
    <div className="relative animate-fade-up">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-200/40 to-brand-500/20 blur-2xl" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Dashboard
          </div>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <div
              key={t.label}
              className={`rounded-xl border p-3 ${
                t.warn
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="text-xs text-slate-500">{t.label}</div>
              <div
                className={`mt-1 text-xl font-bold ${
                  t.warn ? "text-amber-700" : "text-slate-900"
                }`}
              >
                {t.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Raw materials</span>
            <span>Stock</span>
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-700">
                  {r.name}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                    r.warn
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {r.stock} {r.warn ? "⚠ low" : "ok"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
