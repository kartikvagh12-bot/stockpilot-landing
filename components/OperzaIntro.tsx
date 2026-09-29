// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// defines the software first. It does not explain the plans: Factory, Books
// and Complete are covered further down the page. It is an introduction, not
// a feature section: no CTA, no card behind the copy. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// The copy is dark slate. Red is carried by text alone: the label and one
// short phrase in the definition, both brand-600, which holds AA contrast on
// this light ground. No ornament before the label. No heading element on
// purpose: a heading ahead of the page's h1 would make the outline read
// backwards. The label names the section through aria-labelledby.
//
// The section is a white tunnel of nested architectural frames. Its edges are
// the outermost opening; each frame after it sits deeper, so it is smaller and
// closer to one vanishing point (--vx, --vy), set well right of centre on wide
// screens so the copy has calm space on the left. Below 1280px the copy
// fills the width, so the section gains a band under it and the vanishing
// point drops into that band, where the tunnel's deep end shows. A frame at depth i is drawn at scale s = 1 / (1 + k * i), with the step k
// set per breakpoint (shallower on very wide screens, so no rib edge lines up
// with the copy's margin): its box is
// the section's box pulled toward the vanishing point by (1 - s), and its
// thickness, corner radius and shadow scale with s too, so the ribs tighten
// as they recede.
//
// Each frame is a thick rounded rib: a pearl face lit from the upper left,
// and inside it a recessed well, shaded darker along its upper and left
// edges where the rib in front of it occludes the light. Corners are rounded
// with clip-path, so each rib is a solid shape, not an outline. Faces and wells
// darken slightly with depth, so the far end reads deeper. At the far end a
// small rear opening carries the one red light, a thin seam with a soft glow.
// A soft pearl falloff behind the copy keeps the text clear. Static; CSS and
// DOM only (no canvas, SVG, image or dependency).

const COUNT = 10;

const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(", ")})`;

const FRAMES = Array.from({ length: COUNT }, (_, i) => {
  const d = i / (COUNT - 1);
  return {
    i,
    lit: mix([255, 255, 255], [226, 231, 236], d),
    face: mix([240, 243, 246], [196, 204, 213], d),
    well: mix([226, 231, 236], [176, 185, 196], d),
  };
});

const TUNNEL_CSS = `
.oi-tunnel {
  --k: 0.34;
  --vx: 70%;
  --vy: 50%;
  --w: 30px;
  --rad: 40px;
}
.oi-frame,
.oi-rear {
  --s: calc(1 / (1 + var(--k) * var(--i)));
}
.oi-frame {
  position: absolute;
  left: calc(var(--vx) * (1 - var(--s)));
  right: calc((100% - var(--vx)) * (1 - var(--s)));
  top: calc(var(--vy) * (1 - var(--s)));
  bottom: calc((100% - var(--vy)) * (1 - var(--s)));
  clip-path: inset(0 round calc(var(--rad) * var(--s)));
  background: linear-gradient(135deg, var(--lit) 0%, var(--face) 70%);
}
.oi-frame::before {
  content: "";
  position: absolute;
  inset: calc(var(--w) * var(--s));
  clip-path: inset(0 round calc(var(--rad) * var(--s) * 0.7));
  background: var(--well);
  box-shadow:
    inset calc(12px * var(--s)) calc(14px * var(--s)) calc(30px * var(--s)) rgba(15, 23, 42, 0.2),
    inset calc(-4px * var(--s)) calc(-4px * var(--s)) calc(14px * var(--s)) rgba(255, 255, 255, 0.5),
    inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}
.oi-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.9), inset -1px -1px 0 rgba(15, 23, 42, 0.06);
  pointer-events: none;
}
.oi-rear {
  position: absolute;
  left: calc(var(--vx) * (1 - var(--s)));
  right: calc((100% - var(--vx)) * (1 - var(--s)));
  top: calc(var(--vy) * (1 - var(--s)));
  bottom: calc((100% - var(--vy)) * (1 - var(--s)));
  clip-path: inset(0 round calc(var(--rad) * var(--s)));
  background: radial-gradient(70% 90% at 50% 100%, rgba(243, 24, 32, 0.22) 0%, rgba(243, 24, 32, 0) 70%), #f7f9fb;
  box-shadow: inset 0 0 18px rgba(15, 23, 42, 0.12);
}
.oi-rear::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 22%;
  height: 2px;
  background: linear-gradient(90deg, rgba(243, 24, 32, 0), rgba(243, 24, 32, 0.85) 30%, rgba(243, 24, 32, 0.85) 70%, rgba(243, 24, 32, 0));
  box-shadow: 0 0 10px 1px rgba(243, 24, 32, 0.35);
}
.oi-read {
  position: absolute;
  inset: 0;
  background: radial-gradient(50% 72% at 27% 52%, rgba(248, 250, 251, 0.93) 0%, rgba(248, 250, 251, 0.82) 55%, rgba(248, 250, 251, 0) 100%);
}
@media (min-width: 1800px) {
  .oi-tunnel { --k: 0.26; }
}
@media (min-width: 768px) and (max-width: 1279px) {
  .oi-tunnel { --vx: 62%; --vy: 84%; --w: 24px; --rad: 32px; }
  .oi-read { background: linear-gradient(180deg, rgba(248, 250, 251, 0.88) 0%, rgba(248, 250, 251, 0.8) calc(100% - 200px), rgba(248, 250, 251, 0) calc(100% - 110px)); }
}
@media (max-width: 767px) {
  .oi-tunnel { --vx: 54%; --vy: 86%; --w: 16px; --rad: 22px; }
  .oi-frame-deep { display: none; }
  .oi-read { background: linear-gradient(180deg, rgba(248, 250, 251, 0.9) 0%, rgba(248, 250, 251, 0.82) calc(100% - 150px), rgba(248, 250, 251, 0) calc(100% - 80px)); }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="oi-tunnel relative overflow-hidden bg-[#e8ecf0] text-slate-900"
    >
      <style>{TUNNEL_CSS}</style>
      <div className="pointer-events-none absolute inset-0">
        {FRAMES.map((f) => (
          <div
            key={f.i}
            className={f.i >= 7 ? "oi-frame oi-frame-deep" : "oi-frame"}
            style={
              {
                "--i": f.i,
                "--lit": f.lit,
                "--face": f.face,
                "--well": f.well,
              } as React.CSSProperties
            }
          />
        ))}
        <div
          className="oi-rear"
          style={{ "--i": COUNT } as React.CSSProperties}
        />
        <div className="oi-read" />
      </div>

      <div className="container-wide relative pl-10 pr-10 pt-[76px] pb-[150px] sm:px-12 sm:pt-20 sm:pb-[200px] lg:px-14 xl:py-[104px]">
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
