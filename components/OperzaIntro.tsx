// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// defines the software first. It does not explain the plans: Factory, Books
// and Complete are covered further down the page. It is an introduction, not
// a feature section: no CTA, no card behind the copy. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// Red in the copy is carried by text alone: the label, and one short phrase in
// the definition, both in the logo red, which holds AA contrast on this dark
// ground. No ornament before the label. No heading element on purpose: a
// heading ahead of the page's h1 would make the outline read backwards. The
// label names the section through aria-labelledby.
//
// The background is one sculptural form on a near-black ground: a large
// curved sheet of points, like a surface of connected measurements. It is
// real CSS 3D rather than a picture. The sheet is a run of narrow dotted
// strips, each turned around a shared axis, so together they bend into a
// curve; perspective makes the dots tighten as the surface falls away, and
// each strip's brightness follows its angle to a light from the upper left,
// so the curve reads as lit. A low red glow sits inside the curl as the one
// accent. A dark falloff behind the copy keeps the text clear. CSS and DOM
// only: no canvas, SVG, image or dependency.
//
// On a phone the copy fills the width, so the sheet moves below the text into
// a taller bottom band, and the falloff keeps the whole text column dark.
//
// Motion: the sheet and the glow drift a few pixels at different slow speeds,
// transform only, so there is a little parallax and no layout shift. It stops
// under prefers-reduced-motion, here and in the global rule.
//
// The hero's red glow starts above its own top edge and is clipped there.
// With a dark block above, that clipped edge would show as a line, so the art
// is clipped inside its own layer and the section lays a short fade of the
// ground colour over the top of the hero's padding, which is taller than the
// fade, so it never reaches hero copy.

// The sheet: strips every STEP degrees from FROM to TO around the axis, on
// the inside of the curve (SIDE -1), so the surface sweeps toward the viewer
// at its edges and falls away in the middle. LIGHT is the angle the light
// comes from; BASE is how much of the shadow side still shows.
const RADIUS = 489;
const STRIP = 64;
const FROM = -62;
const TO = 70;
const STEP = 7.5;
const SIDE = -1;
const LIGHT = -38;
const BASE = 0.07;

const STRIPS = Array.from(
  { length: Math.floor((TO - FROM) / STEP) + 1 },
  (_, i) => {
    const angle = FROM + i * STEP;
    const facing = Math.cos(((angle - LIGHT) * Math.PI) / 180);
    return {
      angle,
      light: +(BASE + (1 - BASE) * Math.max(0, facing) ** 2.2).toFixed(3),
    };
  },
);

const SCENE_CSS = `
.oi-stage {
  perspective: 1200px;
  perspective-origin: 64% 38%;
}
.oi-sheet {
  position: absolute;
  left: 68%;
  top: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  transform: rotateY(-38deg) rotateX(8deg) rotateZ(-20deg);
}
.oi-strip {
  position: absolute;
  left: -900px;
  top: ${-STRIP / 2}px;
  width: 1800px;
  height: ${STRIP}px;
  background-image: radial-gradient(circle at center, rgba(226, 232, 240, 0.95) 0 1.3px, transparent 1.9px);
  background-size: 14px 14px;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 22%, black 70%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, black 22%, black 70%, transparent 100%);
  opacity: calc(var(--oi-light) * var(--oi-strength));
  backface-visibility: visible;
}
.oi-glow {
  left: 76%;
  top: 56%;
  width: 560px;
  height: 320px;
  margin-left: -280px;
  margin-top: -160px;
  background: radial-gradient(50% 50% at 50% 50%, rgba(243, 24, 32, 0.34) 0%, rgba(217, 13, 22, 0.12) 45%, rgba(217, 13, 22, 0) 72%);
  filter: blur(26px);
}
.oi-scrim {
  background:
    radial-gradient(62% 90% at 22% 46%, rgba(5, 7, 15, 0.92) 0%, rgba(5, 7, 15, 0.7) 45%, rgba(5, 7, 15, 0) 80%),
    linear-gradient(180deg, rgba(5, 7, 15, 0.55) 0%, rgba(5, 7, 15, 0) 22%, rgba(5, 7, 15, 0) 78%, rgba(5, 7, 15, 0.7) 100%);
}
@keyframes oiDrift {
  from { transform: translate3d(-4px, 3px, 0); }
  to { transform: translate3d(4px, -3px, 0); }
}
@keyframes oiDriftGlow {
  from { transform: translate3d(-10px, 0, 0) scale(1); }
  to { transform: translate3d(10px, 4px, 0) scale(1.05); }
}
.oi-move-sheet { animation: oiDrift 40s ease-in-out infinite alternate; }
.oi-move-glow { animation: oiDriftGlow 28s ease-in-out infinite alternate; }
@media (max-width: 767px) {
  .oi-stage { perspective: 900px; perspective-origin: 60% 90%; }
  .oi-sheet { left: 66%; top: 104%; transform: rotateY(-38deg) rotateX(8deg) rotateZ(-20deg) scale(0.6); }
  .oi-glow { left: 70%; top: 96%; width: 360px; height: 220px; margin-left: -180px; margin-top: -110px; }
  .oi-scrim {
    background:
      linear-gradient(180deg, rgba(5, 7, 15, 0.9) 0%, rgba(5, 7, 15, 0.86) 78%, rgba(5, 7, 15, 0.1) 92%, rgba(5, 7, 15, 0.25) 100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .oi-move-sheet, .oi-move-glow { animation: none; }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative z-10 bg-[#05070f] text-white"
    >
      <style>{SCENE_CSS}</style>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ ["--oi-strength" as string]: 1 }}
      >
        <div className="oi-glow oi-move-glow absolute" />
        <div className="oi-stage absolute inset-0">
          <div className="oi-move-sheet absolute inset-0">
            <div className="oi-sheet">
              {STRIPS.map((s) => (
                <div
                  key={s.angle}
                  className="oi-strip"
                  style={{
                    ["--oi-light" as string]: s.light,
                    transform: `rotateX(${s.angle}deg) translateZ(${SIDE * RADIUS}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="oi-scrim absolute inset-0" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-full h-12 bg-gradient-to-b from-[#05070f] to-transparent" />

      <div className="container-wide relative pt-10 pb-24 sm:py-16 lg:py-20">
        <div className="max-w-4xl">
          <p
            id="operza-intro-label"
            className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-500"
          >
            What is Operza?
          </p>
          <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.02em] text-white sm:mt-4 sm:text-3xl lg:text-[2rem]">
            Operza is a web-based{" "}
            <span className="text-brand-500">
              manufacturing operations and accounting platform
            </span>{" "}
            built for manufacturers.
          </p>
          <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-white/70 sm:mt-6 sm:text-lg sm:leading-8">
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
