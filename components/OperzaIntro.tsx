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
// The space is built around the copy. The text sits on the main reading
// plane, the section's own pearl ground, lit evenly from the upper left.
// That plane ends where the copy ends: --x0 is where the text column starts
// (the container edge plus its padding) and --xr is the column's widest line
// (56rem) plus a margin, so every surface below is placed from the text, not
// from the viewport. Around the reading zone, a few large surfaces:
//
//   - a top fold, a shaded surface that recedes down onto the plane above
//     the copy, with occlusion where it meets it;
//   - a ledge, a lit surface coming forward beneath the copy;
//   - an inner return at the plane's right edge, turned away from the light,
//     with a deep charcoal seam at its back where a red light leaks out;
//   - a large folded slab beyond it, filling the rest of the width, creased
//     so its upper facet catches the light and its lower facet falls into
//     cool graphite shade.
//
// Nothing crosses the copy. Below 1280px the copy fills the width, so --xr
// sits near the right edge, the copy is padded clear of it, and the slab
// becomes a narrow fold at the side. Static; CSS and DOM only (no canvas, SVG,
// image or dependency).

const SPACE_CSS = `
.oi-space {
  --x0: calc(max(0px, (100% - 88rem) / 2) + 2rem);
  --xr: calc(var(--x0) + 56rem + 48px);
  --t: 44px;
  --b: 64px;
  --f: 72px;
  --s: 56px;
  --d: 26px;
  --crease: 46%;
  background:
    linear-gradient(to bottom, rgba(15, 23, 42, 0.09) var(--t), rgba(15, 23, 42, 0.035) calc(var(--t) + 2px), rgba(15, 23, 42, 0) calc(var(--t) + 56px)),
    linear-gradient(to top, rgba(15, 23, 42, 0.07) var(--b), rgba(15, 23, 42, 0) calc(var(--b) + 26px)),
    radial-gradient(60% 90% at 20% 30%, #ffffff 0%, rgba(255, 255, 255, 0) 70%),
    #f4f6f8;
}
.oi-layer {
  position: absolute;
  inset: 0;
}
.oi-top {
  clip-path: polygon(0 0, calc(var(--xr) + var(--f)) 0, calc(var(--xr) + var(--s)) calc(var(--t) + var(--d)), var(--xr) var(--t), 0 var(--t));
  background:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 0, rgba(255, 255, 255, 0) 5px),
    linear-gradient(to bottom, #e9edf1 0%, #dde3e9 100%);
}
.oi-ledge {
  clip-path: polygon(0 calc(100% - var(--b)), var(--xr) calc(100% - var(--b)), calc(var(--xr) + var(--s)) calc(100% - var(--b) - var(--d)), calc(var(--xr) + var(--f)) 100%, 0 100%);
  background:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0, rgba(255, 255, 255, 0.95) 1px, rgba(255, 255, 255, 0) 2px),
    radial-gradient(34% 120% at calc(var(--xr) + 30px) 100%, rgba(243, 24, 32, 0.08) 0%, rgba(243, 24, 32, 0) 70%),
    linear-gradient(to bottom, #fbfcfd 0%, #eef2f5 100%);
}
.oi-return {
  clip-path: polygon(var(--xr) var(--t), calc(var(--xr) + var(--s)) calc(var(--t) + var(--d)), calc(var(--xr) + var(--s)) calc(100% - var(--b) - var(--d)), var(--xr) calc(100% - var(--b)));
  background:
    linear-gradient(to right, rgba(255, 255, 255, 0.7) 0, rgba(255, 255, 255, 0) 3px),
    linear-gradient(to right, rgba(243, 24, 32, 0) 60%, rgba(243, 24, 32, 0.1) 100%),
    linear-gradient(to right, #cfd6de 0%, #aab4bf 100%);
}
.oi-seam {
  left: calc(var(--xr) + var(--s) - 1px);
  top: calc(var(--t) + var(--d) + 12%);
  bottom: calc(var(--b) + var(--d) + 12%);
  width: 3px;
  right: auto;
  background: linear-gradient(to bottom, rgba(42, 48, 57, 0) 0%, #2a3039 18%, #6b1418 50%, #2a3039 82%, rgba(42, 48, 57, 0) 100%);
  box-shadow: 0 0 12px 1px rgba(243, 24, 32, 0.18), 0 0 40px 8px rgba(243, 24, 32, 0.06);
}
.oi-slab-up {
  clip-path: polygon(calc(var(--xr) + var(--s)) calc(var(--t) + var(--d)), calc(var(--xr) + var(--f)) 0, 100% 0, 100% calc(var(--crease) - 10%), calc(var(--xr) + var(--s)) var(--crease));
  background:
    linear-gradient(to bottom right, rgba(255, 255, 255, 0) 70%, rgba(255, 255, 255, 0.8) 100%),
    linear-gradient(100deg, #e2e7ec 0%, #f4f6f8 35%, #fbfcfd 100%);
}
.oi-slab-down {
  clip-path: polygon(calc(var(--xr) + var(--s)) var(--crease), 100% calc(var(--crease) - 10%), 100% 100%, calc(var(--xr) + var(--f)) 100%, calc(var(--xr) + var(--s)) calc(100% - var(--b) - var(--d)));
  background:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.85) 0, rgba(255, 255, 255, 0) 3px),
    radial-gradient(40% 60% at 0% 60%, rgba(243, 24, 32, 0.08) 0%, rgba(243, 24, 32, 0) 70%),
    linear-gradient(100deg, #b9c2cc 0%, #cfd6de 40%, #dde3e9 100%);
}
.oi-copy { padding-top: calc(var(--t) + 52px); padding-bottom: calc(var(--b) + 44px); }
@media (min-width: 768px) and (max-width: 1279px) {
  .oi-space { --xr: calc(100% - 22%); --t: 36px; --b: 52px; --f: 48px; --s: 40px; --d: 18px; }
  .oi-copy { padding-right: calc(22% + 32px); }
}
@media (max-width: 767px) {
  .oi-space { --xr: calc(100% - 64px); --t: 26px; --b: 36px; --f: 30px; --s: 20px; --d: 12px; --crease: 42%; }
  .oi-copy { padding-right: 84px; padding-top: calc(var(--t) + 36px); padding-bottom: calc(var(--b) + 32px); }
}
@media (max-width: 379px) {
  .oi-space { --xr: calc(100% - 40px); --f: 20px; --s: 14px; --d: 8px; }
  .oi-copy { padding-right: 56px; }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="oi-space relative overflow-hidden text-slate-900"
    >
      <style>{SPACE_CSS}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="oi-layer oi-top" />
        <div className="oi-layer oi-ledge" />
        <div className="oi-layer oi-return" />
        <div className="oi-layer oi-slab-up" />
        <div className="oi-layer oi-slab-down" />
        <div className="oi-layer oi-seam" />
      </div>

      <div className="oi-copy container-wide relative">
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
