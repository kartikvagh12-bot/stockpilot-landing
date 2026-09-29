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
// The section itself is a white recessed room, seen straight on. Its edges are
// the opening; a back wall sits inset inside them, and four planes join the
// two: the ceiling and floor slope in from the top and bottom, a thin left
// wall stays out of the copy's way, and a deep right wall recedes toward the
// back. Each plane is a full-section layer cut to its trapezoid with a
// clip-path, so the room is five layers and a light, not a drawing.
//
// The insets are four custom properties (--l, --t, --r, --b: how far the back
// wall sits in from each edge), set per breakpoint, and every polygon and seam
// is written in terms of them.
//
// Light comes from the upper front left: the right wall faces it and is the
// brightest plane, the back wall is evenly lit and brightest where the copy
// sits, the floor takes a softer light, and the ceiling and left wall are in
// shade. Where planes meet, a crisp seam softens into ambient occlusion. One
// narrow red light slot sits in the rear right corner, washing a little of
// the right wall and the floor near it. The copy sits on the back wall.
//
// Static on purpose: the room reads as architecture without motion. CSS and
// DOM only: no canvas, SVG, image or dependency.

const ROOM_CSS = `
.oi-room {
  --l: 24px;
  --t: 64px;
  --r: 24%;
  --b: 64px;
}
.oi-plane {
  position: absolute;
  inset: 0;
}
.oi-back {
  clip-path: polygon(var(--l) var(--t), calc(100% - var(--r)) var(--t), calc(100% - var(--r)) calc(100% - var(--b)), var(--l) calc(100% - var(--b)));
  background:
    linear-gradient(to bottom, rgba(15, 23, 42, 0.14) var(--t), rgba(15, 23, 42, 0.07) calc(var(--t) + 1px), rgba(15, 23, 42, 0) calc(var(--t) + 80px)),
    linear-gradient(to top, rgba(15, 23, 42, 0.16) var(--b), rgba(15, 23, 42, 0.07) calc(var(--b) + 1px), rgba(15, 23, 42, 0) calc(var(--b) + 64px)),
    linear-gradient(to left, rgba(15, 23, 42, 0.1) var(--r), rgba(15, 23, 42, 0.04) calc(var(--r) + 1px), rgba(15, 23, 42, 0) calc(var(--r) + 90px)),
    linear-gradient(to right, rgba(15, 23, 42, 0.08) var(--l), rgba(15, 23, 42, 0.03) calc(var(--l) + 1px), rgba(15, 23, 42, 0) calc(var(--l) + 50px)),
    radial-gradient(65% 85% at 30% 42%, #ffffff 0%, rgba(255, 255, 255, 0) 75%),
    #f1f4f7;
}
.oi-ceiling {
  clip-path: polygon(0 0, 100% 0, calc(100% - var(--r)) var(--t), var(--l) var(--t));
  background:
    radial-gradient(40% 90% at 38% 100%, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5) 0, rgba(255, 255, 255, 0) 6px),
    linear-gradient(to right, rgba(15, 23, 42, 0) 55%, rgba(15, 23, 42, 0.05) 100%),
    linear-gradient(to bottom, #e1e6eb 0%, #d4dbe2 100%);
}
.oi-floor {
  clip-path: polygon(var(--l) calc(100% - var(--b)), calc(100% - var(--r)) calc(100% - var(--b)), 100% 100%, 0 100%);
  background:
    radial-gradient(9% 40% at calc(100% - var(--r)) calc(100% - var(--b)), rgba(243, 24, 32, 0.06) 0%, rgba(243, 24, 32, 0) 70%),
    linear-gradient(to top, rgba(15, 23, 42, 0.1) 0, rgba(15, 23, 42, 0) 10px),
    linear-gradient(to top, #dbe1e7 0%, #e9edf1 100%);
}
.oi-left {
  clip-path: polygon(0 0, var(--l) var(--t), var(--l) calc(100% - var(--b)), 0 100%);
  background: linear-gradient(to right, #d0d7de 0%, #dce2e8 100%);
}
.oi-right {
  clip-path: polygon(100% 0, 100% 100%, calc(100% - var(--r)) calc(100% - var(--b)), calc(100% - var(--r)) var(--t));
  background:
    linear-gradient(to right, rgba(243, 24, 32, 0.06) 0%, rgba(243, 24, 32, 0) 18%),
    linear-gradient(to right, rgba(15, 23, 42, 0.12) 0, rgba(15, 23, 42, 0.04) 2px, rgba(15, 23, 42, 0) 70px),
    radial-gradient(130% 62% at 100% 50%, #fbfcfd 0%, #f1f4f7 45%, #e2e7ec 100%),
    #e2e7ec;
}
.oi-slot {
  position: absolute;
  left: calc(100% - var(--r) - 1px);
  top: calc(var(--t) + (100% - var(--t) - var(--b)) * 0.42);
  width: 2px;
  height: calc((100% - var(--t) - var(--b)) * 0.4);
  background: linear-gradient(to bottom, rgba(243, 24, 32, 0) 0%, rgba(243, 24, 32, 0.7) 25%, rgba(243, 24, 32, 0.7) 75%, rgba(243, 24, 32, 0) 100%);
  box-shadow: 0 0 8px 1px rgba(243, 24, 32, 0.2), 0 0 36px 8px rgba(243, 24, 32, 0.06);
}
@media (min-width: 768px) and (max-width: 1279px) {
  .oi-room { --l: 16px; --t: 44px; --r: 14%; --b: 48px; }
}
@media (max-width: 767px) {
  .oi-room { --l: 8px; --t: 34px; --r: 34px; --b: 40px; }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="oi-room relative overflow-hidden bg-[#f1f4f7] text-slate-900"
    >
      <style>{ROOM_CSS}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="oi-plane oi-back" />
        <div className="oi-plane oi-ceiling" />
        <div className="oi-plane oi-floor" />
        <div className="oi-plane oi-left" />
        <div className="oi-plane oi-right" />
        <div className="oi-slot" />
      </div>

      <div className="container-wide relative pl-8 pr-14 pt-[70px] pb-[76px] sm:px-10 sm:pt-20 sm:pb-24 lg:px-12 xl:py-[104px]">
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
