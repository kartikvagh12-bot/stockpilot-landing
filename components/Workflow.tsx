const STEPS = [
  {
    n: "01",
    title: "Track raw materials",
    body: "Add every part with units, alert levels and current stock. Every receipt, issue or correction is logged with a reason.",
    illustration: <MaterialsViz />,
  },
  {
    n: "02",
    title: "Define BOMs",
    body: "Set the exact parts and quantities that go into each product. Recipes stop living inside one person's head.",
    illustration: <BomViz />,
  },
  {
    n: "03",
    title: "Run production",
    body: "Pick a product, enter quantity, click run. Raw materials are deducted and finished goods updated — atomically.",
    illustration: <ProductionViz />,
  },
  {
    n: "04",
    title: "Manage finished goods",
    body: "Know exactly what's ready to ship. Record sales, dispatches and customer returns with full history.",
    illustration: <FinishedViz />,
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="section relative">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">How it works</span>
          <h2 className="h-section">
            One clear workflow, from raw material to dispatched unit.
          </h2>
          <p className="p-section">
            Operza is built around how factories actually operate — not a
            generic ERP. Four steps, the same on day one as on day five
            hundred.
          </p>
          <p className="mt-5 text-sm text-slate-500">
            Most spreadsheet-based workflows fail an operational visibility
            check.{" "}
            <a
              href="/health-check"
              className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              See where yours stands →
            </a>
          </p>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium tracking-wider text-slate-400">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden text-slate-300 lg:inline-flex"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                {s.illustration}
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function MiniRow({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-2.5 py-1.5 text-[11px]">
      <span className="font-medium text-slate-700">{label}</span>
      <span
        className={`rounded px-1.5 py-0.5 font-semibold ${
          warn
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MaterialsViz() {
  return (
    <div className="space-y-1.5">
      <MiniRow label="Wood plank pine" value="240 pcs" />
      <MiniRow label="Screws M6" value="18 pcs" warn />
      <MiniRow label="Wood glue 250ml" value="32 btl" />
    </div>
  );
}

function BomViz() {
  return (
    <div className="rounded-md bg-white p-2.5 text-[11px]">
      <div className="flex items-center justify-between font-semibold text-slate-800">
        <span>Dining chair · BOM</span>
        <span className="text-slate-400">v3</span>
      </div>
      <ul className="mt-2 space-y-1 text-slate-600">
        <li className="flex justify-between">
          <span>· Wood plank pine</span>
          <span className="text-slate-400">4 pcs</span>
        </li>
        <li className="flex justify-between">
          <span>· Screws M6</span>
          <span className="text-slate-400">12 pcs</span>
        </li>
        <li className="flex justify-between">
          <span>· Wood glue 250ml</span>
          <span className="text-slate-400">0.2 btl</span>
        </li>
      </ul>
    </div>
  );
}

function ProductionViz() {
  return (
    <div className="rounded-md bg-white p-2.5 text-[11px]">
      <div className="flex items-center justify-between text-slate-700">
        <span className="font-semibold">Run production</span>
        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Run
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-slate-500">Product</span>
        <span className="font-medium text-slate-800">Dining chair</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-slate-500">Quantity</span>
        <span className="font-medium text-slate-800">20 units</span>
      </div>
      <div className="mt-2 rounded bg-emerald-50 px-2 py-1 text-emerald-700">
        Deducts 80 planks · adds 20 units
      </div>
    </div>
  );
}

function FinishedViz() {
  return (
    <div className="space-y-1.5">
      <MiniRow label="Dining chair" value="316 units" />
      <MiniRow label="Bar stool" value="42 units" />
      <MiniRow label="Side table" value="8 units" warn />
    </div>
  );
}
