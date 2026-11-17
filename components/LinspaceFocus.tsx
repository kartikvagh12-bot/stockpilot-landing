// The four parts of construction work Operza Linspace is being designed
// around. Each line describes the WORK, not a feature: nothing here says the
// product reads a drawing, measures a quantity or produces a document today.
// The list is the Founder-approved product direction and nothing more.

const AREAS = [
  {
    title: "Construction drawings",
    body: "The drawings a project is built from, and the information they hold.",
  },
  {
    title: "Quantity takeoff",
    body: "Measuring the quantities of work and material that a drawing describes.",
  },
  {
    title: "Bills of quantities",
    body: "Organising those quantities into the document a project is priced from.",
  },
  {
    title: "Cost estimation",
    body: "Turning quantities into an estimate of what the work will cost.",
  },
];

export default function LinspaceFocus() {
  return (
    <section className="bg-pearl">
      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="label">The work</p>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-4xl lg:leading-[1.1]">
              What Operza Linspace is being designed around.
            </h2>
          </div>
          <ol className="border-t border-slate-300 lg:col-span-8">
            {AREAS.map((a, i) => (
              <li
                key={a.title}
                className="grid gap-2 border-b border-slate-300 py-7 sm:grid-cols-[4rem_14rem_1fr] sm:items-baseline sm:gap-6"
              >
                <span className="text-xs font-semibold tabular-nums tracking-[0.14em] text-brand-600">
                  0{i + 1}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{a.title}</h3>
                <p className="text-base leading-7 text-slate-600">{a.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
