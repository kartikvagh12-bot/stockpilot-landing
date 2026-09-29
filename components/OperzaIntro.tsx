// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// answers that one question in two sentences. It is a definition, not a
// section: no border, no grid, and no plan explanation, which the page covers
// further down. The hero stays the main marketing statement and keeps the
// page's only h1.
//
// Same deep ground and container as the navbar and the hero, and no bottom
// padding, because the hero's own top padding already provides the gap. No
// heading element on purpose: a heading ahead of the page's h1 would make the
// outline read backwards. The label names the section through
// aria-labelledby.

export default function OperzaIntro() {
  return (
    <section aria-labelledby="operza-intro-label" className="section-deep">
      <div className="container-wide pt-8 sm:pt-10">
        <div className="max-w-3xl">
          <p
            id="operza-intro-label"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50"
          >
            What is Operza?
          </p>
          <p className="mt-3 text-lg font-medium leading-snug text-white sm:text-xl">
            Operza is a manufacturing operations and accounting platform for
            manufacturers.
          </p>
          <p className="mt-2 text-[15px] leading-6 text-white/60 sm:text-base sm:leading-7">
            It connects materials, production, inventory, dispatch, sales,
            purchases and accounting in one system, so your factory operations
            and business records stay together.
          </p>
        </div>
      </div>
    </section>
  );
}
