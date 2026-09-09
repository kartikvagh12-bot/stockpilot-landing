import CostingDemo from "@/components/demos/CostingDemo";

// Costing gets the deep treatment and the small interaction, because the
// relationship it describes is easier to feel than to read: move one input,
// watch the margin follow.

const CLAIMS = [
  {
    title: "Cost that follows the recipe",
    body: "Every material receipt updates its average cost. Product cost is rolled up through the recipe, including in-house components, plus labour, overhead and packing where they are set.",
  },
  {
    title: "Margin against the cost of the day",
    body: "Manufacturing cost is captured at the moment of dispatch and stored on the line, so gross margin is measured against the cost as it stood that day, not today's cost.",
  },
  {
    title: "What changed, and when",
    body: "Cost changes lists the products that now cost more or less than when you last made them, and what changed.",
  },
];

export default function Costing() {
  return (
    <section id="costing" className="section-deep scroll-mt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.11]"
      />

      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="eyebrow-invert">Costing and margin</span>
            <h2 className="mt-6 h-deep">
              Know what a unit costs while the inputs change.
            </h2>
            <p className="p-deep">
              When material costs move, an old costing number goes stale. Operza
              keeps the cost current, so the margin you read is measured against
              what the unit actually cost to make.
            </p>

            <div className="mt-10 space-y-8">
              {CLAIMS.map((c) => (
                <div key={c.title} className="claim-invert">
                  <h3 className="text-base font-semibold text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-10 border-l-2 border-brand-500 pl-5 text-sm leading-7 text-white/60">
              Where Books is enabled, closing stock is valued from your purchase
              and production records. You can pin the value at month and year
              ends, and your Profit &amp; Loss and Balance Sheet use those
              pinned figures.
            </p>
          </div>

          <div className="lg:col-span-7">
            <CostingDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
