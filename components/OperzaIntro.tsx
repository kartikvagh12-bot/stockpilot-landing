// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// block answers that one question and nothing more. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// Same deep ground as the navbar and the hero, so the three read as one
// opening. No heading element on purpose: a large h2 ahead of the page's h1
// would make the outline read backwards. The label is plain text, and the
// section is named for assistive tech through aria-labelledby.
//
// Plan boundaries follow operza-app/lib/capabilities.ts: Factory has no
// accounting, Books has no stock, and only Complete connects the two.

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="section-deep border-b border-white/[0.08]"
    >
      <div className="container-wide py-12 sm:py-14 lg:py-16">
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-3">
            <p
              id="operza-intro-label"
              className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/55 lg:pt-1.5"
            >
              <span aria-hidden="true" className="h-px w-6 bg-brand-500" />
              What is Operza?
            </p>
          </div>

          <div className="max-w-3xl lg:col-span-9">
            <p className="text-xl font-medium leading-snug tracking-[-0.01em] text-white sm:text-2xl sm:leading-snug">
              Operza is software for manufacturers to manage factory operations
              and business accounting.
            </p>
            <p className="mt-4 text-base leading-7 text-white/60">
              Use Operza Factory for materials, production and dispatch. Use
              Operza Books for invoices, bills, payments and statements. Operza
              Complete brings the factory floor and the books together in one
              system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
