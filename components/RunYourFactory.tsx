// The Factory narrative, separate from the interactive example above it.
// Grouped into three ideas rather than a grid of feature icons, and with no
// screenshot: the product story is carried by the interaction, this section
// says what is actually covered.

const GROUPS = [
  {
    title: "What you hold",
    body: "Materials carry a stock level, an alert level and a unit. Receipts and adjustments are recorded as they happen, so the number on screen is the number someone entered, with a reason attached.",
    chips: ["Materials", "Alert levels", "Receipts", "Adjustments"],
  },
  {
    title: "What you make",
    body: "Products carry a recipe, including components you make in house before the final product. A run checks every material first: if one is short, nothing is deducted and no units are posted.",
    chips: ["Products", "BOMs and recipes", "In-house components", "Shortage check"],
  },
  {
    title: "What leaves",
    body: "Packing turns loose units into packed ones using the packaging set for that product. Dispatch records the customer, the reference and what went out, and finished-goods stock drops with it.",
    chips: ["Packing", "Finished goods", "Dispatch", "Movement history"],
  },
];

export default function RunYourFactory() {
  return (
    <section id="factory" className="section scroll-mt-16">
      <div className="container-wide">
        <div className="max-w-2xl">
          <span className="eyebrow">Operza Factory</span>
          <h2 className="h-section">Run the floor from one shared record.</h2>
          <p className="p-section">
            Every movement on the floor lands in the same place, so the answer
            to a stock question does not depend on who is in today.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {GROUPS.map((g) => (
            <div key={g.title} className="claim">
              <h3 className="text-base font-semibold text-slate-900">
                {g.title}
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-slate-600">{g.body}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {g.chips.map((c) => (
                  <li
                    key={c}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-2xl border-l-2 border-brand-500 pl-5 text-sm leading-7 text-slate-600 sm:text-base">
          Nothing is quietly rewritten. A recorded movement stays visible, and a
          correction is recorded against the original rather than replacing it.
          A production run can be undone while nothing later depends on it.
        </p>
      </div>
    </section>
  );
}
