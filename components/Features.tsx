const FEATURES = [
  {
    title: "Inventory tracking",
    body: "Add parts with units, alert levels and current stock. Receipts, issues and corrections — every change logged with a reason.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
  {
    title: "BOM management",
    body: "Define exactly which parts and quantities go into every product. Versioned recipes anyone on the floor can read.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    title: "Production workflows",
    body: "One click records a run. Operza deducts raw materials, updates finished goods and writes the log — atomically.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
    ),
  },
  {
    title: "Finished goods tracking",
    body: "Know exactly how many units of every product are on hand. Record sales, dispatches and customer returns with notes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
      </svg>
    ),
  },
  {
    title: "Low stock alerts",
    body: "Set an alert level for every part. The dashboard flags low stock the moment you log in, so you can reorder in time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Inventory history",
    body: "Searchable, filterable history for materials, production and finished goods. Exportable to CSV any time — no questions asked.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 3 3 5-6" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">What&apos;s inside</span>
          <h2 className="h-section">
            Everything your factory actually needs to run.
          </h2>
          <p className="p-section">
            Operza is intentionally focused. Six modules that work together —
            not an ERP you have to hire a consultant to use.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white p-6 transition hover:bg-slate-50/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                {f.icon}
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
