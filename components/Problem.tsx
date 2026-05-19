const PAINS = [
  {
    title: "Excel breaks the moment your team grows",
    body: "Multiple people editing the same sheet, lost rows, broken formulas. By month-end, no one trusts the numbers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
  },
  {
    title: "You spot a stock-out only when production stops",
    body: "Without live alerts, low stock turns into urgent purchases — at higher prices and longer lead times.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    ),
  },
  {
    title: "BOMs live inside someone's head",
    body: "When the senior worker is on leave, no one knows the exact recipe for a product — and material gets wasted.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    title: "Production logs live in notebooks",
    body: "“How much did we make last month?” becomes a half-day exercise. Trends and waste stay invisible.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-6" />
      </svg>
    ),
  },
];

export default function Problem() {
  return (
    <section id="problem" className="section border-y border-slate-200/70 bg-slate-50/60">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">The problem</span>
          <h2 className="h-section">
            Spreadsheets weren&apos;t built to run a factory.
          </h2>
          <p className="p-section">
            Most manufacturers in India still track inventory and production
            on Excel, paper or WhatsApp. It works — until it doesn&apos;t.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                {p.icon}
              </div>
              <h3 className="mt-5 text-sm font-semibold text-slate-900">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
