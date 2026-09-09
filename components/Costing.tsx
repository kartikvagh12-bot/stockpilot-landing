import ScreenshotFrame, { type Shot } from "@/components/ScreenshotFrame";

// The section the old site never had at all, and the clearest reason a factory
// owner would pay. Given the heaviest treatment on the page: deep ground, the
// capture running wide, and the claims set below it as three columns of type
// rather than three more bordered cards.

const COST_CHANGES: Shot = {
  screen: "Cost changes",
  alt: "The Operza cost changes screen, listing products that now cost more or less than when they were last made",
  sample: true,
};

const CLAIMS = [
  {
    title: "Cost that follows the recipe",
    body: "Set labour and overhead per unit, and packing labour and packing overhead per pack. Operza rolls material cost up through every level of the BOM and gives you a cost to make.",
  },
  {
    title: "Selling price against manufacturing cost",
    body: "Manufacturing cost is captured at the moment of dispatch and stored on the line, so gross margin is calculated against the cost as it stood that day, not today's cost.",
  },
  {
    title: "What changed, and when",
    body: "The Cost changes screen lists the products that now cost more or less than when you last made them, and what changed.",
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
        <div className="max-w-3xl">
          <span className="eyebrow-invert">Costing and margin</span>
          <h2 className="mt-6 h-deep">What a unit costs you, kept current.</h2>
          <p className="p-deep">
            When material costs change, an old costing number goes stale.
            Operza keeps the cost current. Every material receipt updates its
            average cost, and every product cost is built up through the
            recipe, including in-house components, plus labour, overhead and
            packing.
          </p>
        </div>

        <ScreenshotFrame
          shot={COST_CHANGES}
          tone="deep"
          className="mt-14 lg:mt-16"
        />

        <div className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {CLAIMS.map((c) => (
            <div key={c.title} className="claim-invert">
              <h3 className="text-base font-semibold text-white">{c.title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-white/60">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Valuation is an accounting surface, so the claim is scoped rather
            than stated for every workspace. Factory has no Books. */}
        <p className="mt-14 max-w-3xl border-l-2 border-brand-500 pl-5 text-sm leading-7 text-white/60 sm:text-base">
          Where Books is enabled, closing stock is valued from your purchase
          and production records. You can pin the value at month and year ends,
          and your Profit &amp; Loss and Balance Sheet use those pinned figures.
        </p>

        <div className="mt-12">
          <a href="#contact" className="btn-invert">
            Book a demo
          </a>
        </div>
      </div>
    </section>
  );
}
