const SHOTS: Array<{
  label: string;
  desc: string;
  render: () => JSX.Element;
}> = [
  {
    label: "Dashboard",
    desc: "Total parts, products, low-stock alerts and finished units — all visible the moment you log in.",
    render: () => <DashboardMock />,
  },
  {
    label: "Run production",
    desc: "Pick a product, enter quantity, click run. Raw materials deducted, finished goods updated, log written — atomically.",
    render: () => <ProductionMock />,
  },
  {
    label: "Inventory history",
    desc: "Every stock movement, with a reason and timestamp. Searchable, filterable, exportable to CSV.",
    render: () => <HistoryMock />,
  },
];

export default function Screenshots() {
  return (
    <section id="screenshots" className="section border-y border-slate-200/70 bg-slate-50/60">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Inside the product</span>
          <h2 className="h-section">A factory dashboard that fits on a phone.</h2>
          <p className="p-section">
            Operza runs in the browser. Use it from a desktop in the office or
            from a phone on the shop floor — same data, same speed.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {SHOTS.map((s) => (
            <figure
              key={s.label}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
            >
              <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-slate-50 to-white">
                <div className="absolute inset-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span className="ml-2 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                      operza · {s.label.toLowerCase()}
                    </span>
                  </div>
                  <div className="p-3">{s.render()}</div>
                </div>
              </div>
              <figcaption className="border-t border-slate-100 p-5">
                <div className="text-sm font-semibold text-slate-900">
                  {s.label}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{s.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  const tiles = [
    { label: "Parts", value: "84" },
    { label: "Products", value: "12" },
    { label: "Low stock", value: "3", warn: true },
    { label: "Units", value: "316" },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`rounded-md border p-1.5 ${
              t.warn
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-[8px] text-slate-500">{t.label}</div>
            <div
              className={`text-[11px] font-semibold ${
                t.warn ? "text-amber-700" : "text-slate-900"
              }`}
            >
              {t.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1">
        {[
          { name: "Wood plank pine", v: "240", warn: false },
          { name: "Screws M6", v: "18", warn: true },
          { name: "Wood glue", v: "32", warn: false },
        ].map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded border border-slate-100 px-2 py-1 text-[9px]"
          >
            <span className="text-slate-700">{r.name}</span>
            <span
              className={`rounded px-1 font-semibold ${
                r.warn
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductionMock() {
  return (
    <div className="space-y-1.5 text-[9px]">
      <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
        <div className="text-[8px] uppercase tracking-wider text-slate-500">
          Product
        </div>
        <div className="font-semibold text-slate-800">Dining chair</div>
      </div>
      <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
        <div className="text-[8px] uppercase tracking-wider text-slate-500">
          Quantity
        </div>
        <div className="font-semibold text-slate-800">20 units</div>
      </div>
      <div className="rounded bg-emerald-50 px-2 py-1.5 text-emerald-700">
        Will deduct 80 planks · 240 screws
      </div>
      <button className="w-full rounded bg-slate-900 px-2 py-1.5 text-center text-[10px] font-semibold text-white">
        Run production
      </button>
    </div>
  );
}

function HistoryMock() {
  const rows = [
    { d: "12 May", w: "Production", q: "−80 planks", t: "Dining chair × 20" },
    { d: "12 May", w: "Adjustment", q: "+50 screws", t: "Receipt · GRN 412" },
    { d: "11 May", w: "Dispatch", q: "−10 units", t: "Sold · Inv 1182" },
    { d: "11 May", w: "Production", q: "−20 fabric", t: "Stool × 5" },
  ];
  return (
    <div className="text-[9px]">
      <div className="grid grid-cols-12 gap-1 border-b border-slate-100 pb-1 font-semibold uppercase tracking-wider text-slate-500">
        <div className="col-span-2">Date</div>
        <div className="col-span-3">Type</div>
        <div className="col-span-3">Change</div>
        <div className="col-span-4">Reason</div>
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-1 border-b border-slate-100 py-1 last:border-b-0"
        >
          <div className="col-span-2 text-slate-500">{r.d}</div>
          <div className="col-span-3 font-medium text-slate-700">{r.w}</div>
          <div className="col-span-3 text-slate-700">{r.q}</div>
          <div className="col-span-4 text-slate-500">{r.t}</div>
        </div>
      ))}
    </div>
  );
}
