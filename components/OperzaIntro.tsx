// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// defines the software first. It does not explain the plans: Factory, Books
// and Complete are covered further down the page. It is an introduction, not
// a feature section: no border, no grid, no CTA. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// A white band between the dark navbar and the dark hero, so the definition
// reads as its own step before the hero starts. Red is carried by text alone:
// the label, and one short phrase in the definition. No ornament before the
// label. No heading element on purpose: a heading ahead of the page's h1 would
// make the outline read backwards. The label names the section through
// aria-labelledby.

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="bg-white text-slate-900"
    >
      <div className="container-wide py-10 sm:py-14 lg:py-16">
        <div className="max-w-4xl">
          <p
            id="operza-intro-label"
            className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600"
          >
            What is Operza?
          </p>
          <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:mt-4 sm:text-3xl lg:text-[2rem]">
            Operza is a web-based{" "}
            <span className="text-brand-600">
              manufacturing operations and accounting platform
            </span>{" "}
            built for manufacturers.
          </p>
          <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
            <p>
              It helps digitize the day-to-day flow of a manufacturing
              business, from materials, products and BOMs through production,
              packing, inventory and dispatch, while also supporting sales,
              purchases, costing, payments and financial records.
            </p>
            <p>
              Instead of information being scattered across spreadsheets,
              registers and disconnected tools, Operza gives manufacturers a
              structured system for recording and understanding the work
              happening across the business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
