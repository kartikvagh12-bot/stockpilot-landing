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
// The background is an abstract industrial sculpture across the full band,
// built from CSS only (no canvas, SVG, image or dependency). Back to front,
// all empty layers behind the text:
//   1. base: a pearl-to-slate gradient with a soft diffused light at the top
//      left, so the copy side is lit rather than blank;
//   2. a faint floor mesh, low and to the right, as secondary texture only;
//   3. a broad curved canopy sweeping in from the top left, carrying the copy
//      on its lit pearl face. It is sized from the content container, not the
//      viewport, so its edge clears the text at every width; on phones it
//      turns into a tall curve whose edge shows along the right side;
//   4. a charcoal slab and a silver slab angled on the right, overlapping,
//      with soft shadows between them;
//   5. Operza red as light from inside the piece: a glow behind the silver
//      slab that leaks out around its edge, and a soft seam of red where the
//      front curve meets the slabs;
//   6. a broad front curve rising across the bottom of the band;
//   7. a slate vignette at the edges.
// Motion: the slabs, the front curve and the red light drift a few pixels at
// different slow speeds, transform only, so the layers separate a little
// without layout shift. All of it stops under prefers-reduced-motion, here
// and in the global rule.

const SCENE_CSS = `
.oi-base {
  background:
    radial-gradient(70% 95% at 14% 8%, rgba(245, 247, 250, 0.95) 0%, rgba(245, 247, 250, 0) 62%),
    linear-gradient(165deg, #d6dce4 0%, #c3cbd5 52%, #a9b3c0 100%);
}
.oi-mesh-wrap {
  perspective: 600px;
  perspective-origin: 70% 30%;
  -webkit-mask-image: radial-gradient(50% 55% at 80% 70%, black 0%, transparent 70%);
  mask-image: radial-gradient(50% 55% at 80% 70%, black 0%, transparent 70%);
}
.oi-mesh {
  position: absolute;
  left: -40%;
  right: -40%;
  bottom: 0;
  height: 220%;
  transform-origin: 50% 100%;
  transform: rotateX(78deg);
  background-image:
    linear-gradient(to right, rgba(30, 41, 59, 0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(30, 41, 59, 0.16) 1px, transparent 1px);
  background-size: 96px 96px;
}
.oi-canopy {
  left: calc(max(0px, (100% - 88rem) / 2) - 66rem);
  top: -80%;
  width: 132rem;
  height: 230%;
  transform: rotate(14deg);
  background: radial-gradient(40% 40% at 68% 55%, #f7f9fb 0%, #eef1f5 50%, #dfe4ea 80%, #cdd4dd 100%);
  box-shadow:
    0 30px 60px -20px rgba(15, 23, 42, 0.22),
    inset -2px -3px 0 rgba(255, 255, 255, 0.85);
}
.oi-slab-back {
  left: 56%;
  top: -12%;
  width: 56%;
  height: 92%;
  clip-path: polygon(30% 0%, 100% 0%, 100% 70%, 0% 100%);
  background: linear-gradient(205deg, #8f9aa8 0%, #6f7a88 55%, #58626f 100%);
  opacity: 0.85;
}
.oi-glow {
  left: 58%;
  top: 48%;
  width: 34%;
  height: 46%;
  background: radial-gradient(50% 50% at 50% 50%, rgba(243, 24, 32, 0.7) 0%, rgba(217, 13, 22, 0.28) 40%, rgba(217, 13, 22, 0) 72%);
  filter: blur(22px);
}
.oi-slab-wrap {
  filter: drop-shadow(0 28px 36px rgba(15, 23, 42, 0.28));
}
.oi-slab {
  position: absolute;
  inset: 0;
  clip-path: polygon(24% 0%, 100% 0%, 100% 58%, 0% 100%);
  background: linear-gradient(158deg, #f4f6f9 0%, #d2d8df 42%, #a7b1bd 100%);
}
.oi-slab-pos {
  left: 62%;
  top: 6%;
  width: 46%;
  height: 76%;
}
.oi-seam {
  left: 40%;
  top: 70%;
  width: 60%;
  height: 26%;
  background: radial-gradient(50% 50% at 62% 60%, rgba(217, 13, 22, 0.46) 0%, rgba(217, 13, 22, 0) 70%);
  filter: blur(16px);
}
.oi-dune {
  left: -20%;
  right: -20%;
  top: 86%;
  height: 140%;
  background: linear-gradient(180deg, #eef1f5 0%, #d3d9e1 26%, #b8c1cc 100%);
  box-shadow:
    0 -26px 60px -24px rgba(15, 23, 42, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.9);
  transform: rotate(-3deg);
}
.oi-vignette {
  background: radial-gradient(130% 140% at 35% 35%, rgba(15, 23, 42, 0) 55%, rgba(15, 23, 42, 0.2) 100%);
}
@keyframes oiDriftA {
  from { transform: translate3d(0, -4px, 0); }
  to { transform: translate3d(0, 4px, 0); }
}
@keyframes oiDriftB {
  from { transform: translate3d(-6px, 0, 0) scale(1); }
  to { transform: translate3d(6px, 3px, 0) scale(1.05); }
}
@keyframes oiDriftDune {
  from { transform: rotate(-3deg) translate3d(0, 3px, 0); }
  to { transform: rotate(-3deg) translate3d(0, -3px, 0); }
}
.oi-move-slab { animation: oiDriftA 38s ease-in-out infinite alternate; }
.oi-move-back { animation: oiDriftA 46s ease-in-out infinite alternate-reverse; }
.oi-move-glow { animation: oiDriftB 30s ease-in-out infinite alternate; }
.oi-move-dune { animation: oiDriftDune 42s ease-in-out infinite alternate; }
@media (max-width: 767px) {
  .oi-mesh-wrap { display: none; }
  .oi-canopy { left: -154%; top: -54%; width: 262%; height: 202%; transform: none; background: radial-gradient(70% 55% at 80% 50%, #f7f9fb 0%, #eef1f5 45%, #d9dfe6 80%, #c8d0da 100%); }
  .oi-slab-back { left: 52%; top: -14%; width: 80%; height: 34%; }
  .oi-slab-pos { left: 64%; top: -4%; width: 60%; height: 30%; }
  .oi-glow { left: 30%; top: 88%; width: 90%; height: 20%; opacity: 0.7; }
  .oi-seam { left: -10%; top: 86%; width: 120%; height: 16%; }
  .oi-dune { top: 93%; }
}
@media (prefers-reduced-motion: reduce) {
  .oi-move-slab, .oi-move-back, .oi-move-glow, .oi-move-dune { animation: none; }
}
`;

const LAYER = "pointer-events-none absolute -z-10";

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative isolate overflow-hidden bg-[#c3cbd5] text-slate-900"
    >
      <style>{SCENE_CSS}</style>
      <div className={`${LAYER} oi-base inset-0`} />
      <div className={`${LAYER} oi-mesh-wrap inset-0`}>
        <div className="oi-mesh" />
      </div>
      <div className={`${LAYER} oi-slab-back oi-move-back`} />
      <div className={`${LAYER} oi-glow oi-move-glow`} />
      <div className={`${LAYER} oi-slab-wrap oi-slab-pos oi-move-slab`}>
        <div className="oi-slab" />
      </div>
      <div className={`${LAYER} oi-canopy rounded-[50%]`} />
      <div className={`${LAYER} oi-seam oi-move-glow`} />
      <div className={`${LAYER} oi-dune oi-move-dune rounded-[50%]`} />
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
