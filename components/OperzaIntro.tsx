// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// defines the software first. It does not explain the plans: Factory, Books
// and Complete are covered further down the page. It is an introduction, not
// a feature section: no CTA, no card behind the copy. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// A cool pearl-and-slate band between the dark navbar and the dark hero. Red
// in the copy is carried by text alone: the label, and one short phrase in the
// definition. No ornament before the label. No heading element on purpose: a
// heading ahead of the page's h1 would make the outline read backwards. The
// label names the section through aria-labelledby.
//
// The background is a full-width industrial space, built from CSS only (no
// canvas, SVG, image or dependency). Back to front, all empty layers behind
// the text:
//   1. base: a mid-tone pearl-to-slate gradient, lighter at the top left;
//   2. one hall in perspective: a floor and a ceiling of fine lines, with
//      light strips running along the ceiling, all converging on a single
//      vanishing point right of centre, so the depth runs across the whole
//      band from the left edge inward;
//   3. red light at that vanishing point: a thin line along the horizon with
//      a bright core, like light at the far end of a factory hall, plus a
//      faint warm reflection on the floor and a cool highlight at the top
//      left. Red reads as light on slate, not as a pink background;
//   4. a pearl lift behind the copy and a slate vignette at the edges, so the
//      text keeps its contrast (the brand-red label needs a light surface).
// Motion: the room, the far light and the reflection move a few pixels at
// different slow speeds, transform only, so there is parallax without layout
// shift. All of it stops under prefers-reduced-motion, here and in the
// global rule.

const SCENE_CSS = `
.oi-base {
  background:
    radial-gradient(90% 110% at 8% 0%, #eef1f5 0%, rgba(238, 241, 245, 0) 60%),
    linear-gradient(180deg, #d5dce4 0%, #c7d0da 55%, #b3bdc9 100%);
}
.oi-room {
  perspective: 520px;
  perspective-origin: 74% 46%;
}
.oi-plane {
  position: absolute;
  background-image:
    linear-gradient(to right, rgba(30, 41, 59, 0.30) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(30, 41, 59, 0.30) 1px, transparent 1px);
  background-size: 64px 64px;
}
.oi-floor {
  left: -80%;
  right: -80%;
  bottom: 0;
  height: 260%;
  transform-origin: 50% 100%;
  transform: rotateX(80deg);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 30%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 30%);
}
.oi-ceiling {
  left: -80%;
  right: -80%;
  top: 0;
  height: 260%;
  opacity: 0.75;
  background-image:
    linear-gradient(to right, transparent 47%, rgba(255, 255, 255, 0.72) 49%, rgba(255, 255, 255, 0.72) 51%, transparent 53%),
    linear-gradient(to right, rgba(30, 41, 59, 0.30) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(30, 41, 59, 0.30) 1px, transparent 1px);
  background-size: 320px 100%, 64px 64px, 64px 64px;
  transform-origin: 50% 0%;
  transform: rotateX(-80deg);
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 30%);
  mask-image: linear-gradient(to top, transparent 0%, black 30%);
}
.oi-far-light {
  left: 74%;
  top: 46%;
  width: 900px;
  height: 120px;
  margin-left: -450px;
  margin-top: -60px;
  background: radial-gradient(50% 50% at 50% 50%, rgba(243, 24, 32, 0.8) 0%, rgba(217, 13, 22, 0.2) 20%, rgba(217, 13, 22, 0) 55%);
  filter: blur(10px);
}
.oi-horizon-line {
  left: 58%;
  right: -5%;
  top: 46%;
  height: 2px;
  margin-top: -1px;
  background: linear-gradient(90deg, rgba(217, 13, 22, 0) 0%, rgba(217, 13, 22, 0.5) 30%, rgba(243, 24, 32, 0.95) 48%, rgba(217, 13, 22, 0.5) 70%, rgba(217, 13, 22, 0) 100%);
  filter: blur(0.6px);
}
.oi-reflection {
  left: 40%;
  right: -10%;
  bottom: -35%;
  height: 70%;
  background: radial-gradient(50% 50% at 60% 50%, rgba(182, 12, 19, 0.12), rgba(182, 12, 19, 0) 70%);
  filter: blur(28px);
}
.oi-cool {
  left: -10%;
  top: -50%;
  width: 70%;
  height: 120%;
  background: radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 70%);
  filter: blur(24px);
}
.oi-lift {
  background: radial-gradient(58% 80% at 26% 48%, rgba(241, 244, 248, 0.92) 0%, rgba(241, 244, 248, 0.72) 40%, rgba(241, 244, 248, 0) 76%);
}
.oi-vignette {
  background: radial-gradient(130% 140% at 40% 40%, rgba(15, 23, 42, 0) 50%, rgba(15, 23, 42, 0.22) 100%);
}
@keyframes oiDriftA {
  from { transform: translate3d(0, -5px, 0); }
  to { transform: translate3d(0, 5px, 0); }
}
@keyframes oiDriftB {
  from { transform: translate3d(-12px, 0, 0) scale(1); }
  to { transform: translate3d(12px, 6px, 0) scale(1.06); }
}
.oi-move-room { animation: oiDriftA 36s ease-in-out infinite alternate; }
.oi-move-light { animation: oiDriftB 24s ease-in-out infinite alternate; }
.oi-move-light-slow { animation: oiDriftB 40s ease-in-out infinite alternate-reverse; }
@media (max-width: 767px) {
  /* On a phone the copy fills the band, so the vanishing point drops to the
     bottom edge: the ceiling fans across the whole section and the red light
     sits just above the hero, below the last line of text. */
  .oi-room { perspective: 420px; perspective-origin: 72% 97%; }
  .oi-plane { background-size: 52px 52px; }
  .oi-ceiling { opacity: 0.95; background-size: 220px 100%, 52px 52px, 52px 52px; }
  .oi-far-light { left: 72%; top: 97%; width: 360px; height: 80px; margin-left: -180px; margin-top: -40px; }
  .oi-horizon-line { top: 97%; left: 0; right: 0; }
  .oi-reflection { display: none; }
  .oi-lift {
    background: linear-gradient(180deg, rgba(241, 244, 248, 0.84) 0%, rgba(241, 244, 248, 0.66) 32%, rgba(241, 244, 248, 0.4) 75%, rgba(241, 244, 248, 0.1) 100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .oi-move-room, .oi-move-light, .oi-move-light-slow { animation: none; }
}
`;

const LAYER = "pointer-events-none absolute -z-10";

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative isolate overflow-hidden bg-[#c7d0da] text-slate-900"
    >
      <style>{SCENE_CSS}</style>
      <div className={`${LAYER} oi-base inset-0`} />
      <div className={`${LAYER} oi-room oi-move-room inset-0`}>
        <div className="oi-plane oi-ceiling" />
        <div className="oi-plane oi-floor" />
      </div>
      <div className={`${LAYER} oi-reflection oi-move-light-slow`} />
      <div className={`${LAYER} oi-horizon-line`} />
      <div className={`${LAYER} oi-far-light oi-move-light`} />
      <div className={`${LAYER} oi-cool`} />
      <div className={`${LAYER} oi-lift inset-0`} />
      <div className={`${LAYER} oi-vignette inset-0`} />

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
