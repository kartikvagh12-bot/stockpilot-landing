// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// defines the software first. It does not explain the plans: Factory, Books
// and Complete are covered further down the page. It is an introduction, not
// a feature section: no border, no grid, no CTA. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// A light band between the dark navbar and the dark hero, so the definition
// reads as its own step before the hero starts. Red is carried by text alone:
// the label, and one short phrase in the definition. No ornament before the
// label. No heading element on purpose: a heading ahead of the page's h1 would
// make the outline read backwards. The label names the section through
// aria-labelledby.
//
// Background, back to front, all empty decorative layers behind the text:
//   1. a white-to-cool-slate wash, so the band is light but not flat white;
//   2. a receding floor plane of faint lines on the right (md and up only),
//      tilted in perspective for depth and faded out before it reaches the
//      copy, a quiet nod to a shop floor rather than a picture of one;
//   3. two large blurred glows, one warm brand red and one cool slate, that
//      drift very slowly. The motion is CSS only, transform only (no layout
//      shift), and stops under prefers-reduced-motion, here and in the
//      site-wide rule in globals.css.
// The glows are faint (red at 10%, slate at 22%, then blurred) and sit away
// from the copy, so body text contrast is effectively unchanged.

const DRIFT_CSS = `
@keyframes operzaIntroDrift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(-5%, 6%, 0) scale(1.08); }
}
.operza-intro-drift {
  animation: operzaIntroDrift 28s ease-in-out infinite alternate;
  will-change: transform;
}
.operza-intro-drift-slow {
  animation: operzaIntroDrift 36s ease-in-out infinite alternate-reverse;
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .operza-intro-drift,
  .operza-intro-drift-slow {
    animation: none;
  }
}
`;

const FLOOR_LINES =
  "linear-gradient(to right, rgba(15, 23, 42, 0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.13) 1px, transparent 1px)";

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative isolate overflow-hidden bg-white text-slate-900"
    >
      <style>{DRIFT_CSS}</style>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[58%] md:block"
        style={{
          perspective: "900px",
          maskImage:
            "linear-gradient(to left, black 35%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to left, black 35%, transparent 100%)",
        }}
      >
        <div
          className="absolute"
          style={{
            inset: "-60% -20% -8% -20%",
            transform: "rotateX(60deg)",
            transformOrigin: "50% 100%",
            backgroundImage: FLOOR_LINES,
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to top, black 10%, transparent 85%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 10%, transparent 85%)",
          }}
        />
      </div>
      <div className="operza-intro-drift pointer-events-none absolute -right-[40%] -top-[20%] -z-10 h-[280px] w-[360px] rounded-full bg-brand-500/10 sm:-right-[6%] sm:-top-[50%] sm:h-[560px] sm:w-[820px] blur-3xl" />
      <div className="operza-intro-drift-slow pointer-events-none absolute -bottom-[55%] left-[8%] -z-10 h-[440px] w-[680px] rounded-full bg-slate-400/[0.22] blur-3xl" />

      <div className="container-wide py-10 sm:py-16 lg:py-20">
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
