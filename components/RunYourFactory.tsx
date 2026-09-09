import ScreenshotFrame, { type Shot } from "@/components/ScreenshotFrame";

// Asymmetric on purpose. The old Workflow section was four equal cards and the
// old Features section was six equal cells, which flattened everything to the
// same importance. Here one screenshot anchors the section and the claims run
// beside it as typographic blocks rather than a fourth card grid.

const PRODUCTION: Shot = {
  src: "/product/run-production.png",
  screen: "Run production",
  alt: "The Operza run production screen with a product selected, showing the batch size, the yield, and a confirmation that the batch is within current material availability",
  width: 963,
  height: 671,
};

const CLAIMS = [
  {
    title: "Can we make this today?",
    body: "The dashboard shows which materials are at or below their alert level, which products are blocked, and which material is limiting you.",
  },
  {
    title: "A short run does not half happen.",
    body: "If any material is short, nothing is deducted and no units are posted. Same in packing: if anything is short, nothing is packed.",
  },
  {
    title: "Dispatch, recorded properly.",
    body: "Record the customer, the invoice reference and the products going out. Finished-goods stock drops automatically.",
  },
];

export default function RunYourFactory() {
  return (
    <section id="factory" className="section scroll-mt-16 border-t border-slate-200/70">
      <div className="container-wide">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="eyebrow">Operza Factory</span>
            <h2 className="h-section">The floor, recorded as it runs.</h2>
            <p className="p-section">
              Materials carry a stock level and an alert level. Products carry a
              recipe, including the components you make in house. A run checks
              every material, deducts them, adds the finished units and writes
              the batch to history.
            </p>

            <div className="mt-12 space-y-8">
              {CLAIMS.map((c) => (
                <div key={c.title} className="claim">
                  <h3 className="text-base font-semibold text-slate-900">
                    {c.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm text-slate-500">
              <a
                href="#costing"
                className="font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                See how costing works
              </a>
            </p>
          </div>

          {/* One capture, not a gallery. The screen states the section's
              central promise in the product's own words. */}
          <div className="lg:col-span-7">
            <ScreenshotFrame shot={PRODUCTION} className="lg:mt-6" />
          </div>
        </div>
      </div>
    </section>
  );
}
