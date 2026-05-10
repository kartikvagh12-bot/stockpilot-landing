const SHOTS = [
  {
    label: "Dashboard",
    desc: "Total parts, products, low stock alerts and finished units — all visible the moment you log in.",
  },
  {
    label: "Run Production",
    desc: "Pick a product, enter quantity, click run. Raw materials deducted, finished goods updated, log saved — atomically.",
  },
  {
    label: "Inventory History",
    desc: "Every stock movement, with a reason and timestamp. Searchable, filterable, exportable to CSV.",
  },
];

export default function Screenshots() {
  return (
    <section id="screenshots" className="section bg-slate-50/60">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Inside the product</span>
          <h2 className="h-section">A factory dashboard that fits on a phone.</h2>
          <p className="p-section">
            StockPilot runs in the browser. Use it from a desktop in the office
            or from a phone on the shop floor — same data, same speed.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {SHOTS.map((s) => (
            <figure
              key={s.label}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-soft"
            >
              <ScreenshotPlaceholder label={s.label} />
              <figcaption className="border-t border-slate-100 p-5">
                <div className="text-sm font-semibold text-slate-900">
                  {s.label}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{s.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Screenshots are placeholders — drop your own PNGs into{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">/public/screenshots</code>{" "}
          when ready.
        </p>
      </div>
    </section>
  );
}

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="absolute inset-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            stockpilot · {label.toLowerCase()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-10 rounded-md bg-slate-100" />
          <div className="h-10 rounded-md bg-slate-100" />
          <div className="h-10 rounded-md bg-brand-100" />
        </div>
        <div className="flex-1 rounded-lg bg-slate-50 p-3">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 rounded bg-slate-200" />
            <div className="h-2.5 w-5/6 rounded bg-slate-200" />
            <div className="h-2.5 w-4/6 rounded bg-slate-200" />
            <div className="h-2.5 w-3/6 rounded bg-brand-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
