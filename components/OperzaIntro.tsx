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
//
// The hero's red glow starts above its own top edge and is clipped there. With
// the navbar directly above, that edge was hidden; with this block above, it
// showed as a hard line. So this block does not clip (no `section-deep`, which
// sets overflow-hidden) and lays a short fade of the ground colour over the
// top of the hero's padding, letting the glow come in gradually. The fade is
// shorter than the hero's smallest top padding, so it never reaches hero copy.

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative z-10 bg-[#05070f] text-white"
    >
      <div className="container-wide pt-8 sm:pt-10">
        <div className="max-w-4xl">
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
          <p className="mt-2 max-w-3xl text-[15px] leading-6 text-white/60 sm:text-base sm:leading-7">
            It connects materials, production, inventory, dispatch, sales,
            purchases and accounting in one system, so your factory operations
            and business records stay together.
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-full h-12 bg-gradient-to-b from-[#05070f] to-transparent"
      />
    </section>
  );
}
