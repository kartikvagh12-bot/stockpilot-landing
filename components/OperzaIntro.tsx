// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// answers that question first. It is an introduction, not a feature section:
// no border, no grid, no CTA. The hero stays the main marketing statement and
// keeps the page's only h1.
//
// A white band between the dark navbar and the dark hero, so the definition
// reads as its own step before the hero starts. Red is used once, on the
// label. No heading element on purpose: a heading ahead of the page's h1
// would make the outline read backwards. The label names the section through
// aria-labelledby.
//
// Plan boundaries follow operza-app/lib/capabilities.ts: the capabilities are
// listed across Factory and Books, and only Complete connects the two.

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="bg-white text-slate-900"
    >
      <div className="container-wide py-9 sm:py-14 lg:py-16">
        <div className="max-w-4xl">
          <p
            id="operza-intro-label"
            className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 sm:text-sm"
          >
            <span aria-hidden="true" className="h-0.5 w-8 bg-brand-600" />
            What is Operza?
          </p>
          <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:mt-4 sm:text-3xl lg:text-[2rem]">
            Operza is a manufacturing operations and accounting platform for
            manufacturers.
          </p>
          <p className="mt-3 max-w-3xl text-[15px] leading-6 text-slate-600 sm:mt-4 sm:text-lg sm:leading-8">
            Across Operza Factory and Operza Books, Operza helps manufacturers
            manage materials, production, inventory, dispatch, sales, purchases
            and business records. Operza Complete brings both sides together
            in one connected system, so the factory floor and the books stay in
            sync.
          </p>
        </div>
      </div>
    </section>
  );
}
