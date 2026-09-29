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
// The background is an abstract light wallpaper across the whole section:
// a few very large, soft, curved sheets that overlap and flow across it, each
// shaded like a gently lit surface (bright on its upper side, a soft shadow
// along its lower edge), so the field has depth without depicting anything.
// A fine dot texture drifts over the field and fades out toward the edges,
// and one curve carries a faint red rim light. Contrast stays low where the
// copy sits, so the text reads first. Static; CSS and DOM only (no canvas,
// SVG, image or dependency).

const FIELD_CSS = `
.oi-field {
  background:
    radial-gradient(70% 90% at 18% 20%, #ffffff 0%, rgba(255, 255, 255, 0) 70%),
    linear-gradient(160deg, #f8fafb 0%, #f1f4f7 55%, #e9edf1 100%);
}
.oi-sheet {
  position: absolute;
}
.oi-sheet-a {
  left: -20%;
  top: 38%;
  width: 150%;
  height: 120%;
  transform: rotate(-7deg);
  background: linear-gradient(175deg, #ffffff 0%, #f3f6f8 30%, #e8edf1 100%);
  box-shadow: 0 -28px 64px -20px rgba(15, 23, 42, 0.15), inset 0 18px 30px -18px rgba(255, 255, 255, 1);
}
.oi-sheet-b {
  left: 34%;
  top: -60%;
  width: 110%;
  height: 120%;
  transform: rotate(14deg);
  background: linear-gradient(200deg, #eef2f5 0%, #f7f9fa 55%, #ffffff 100%);
  box-shadow: 0 26px 60px -24px rgba(15, 23, 42, 0.14), inset 0 -16px 28px -16px rgba(255, 255, 255, 1);
}
.oi-sheet-c {
  left: 58%;
  top: 22%;
  width: 70%;
  height: 130%;
  transform: rotate(-22deg);
  background: linear-gradient(150deg, #fbfcfd 0%, #eef2f5 60%, #e3e8ed 100%);
  box-shadow:
    -18px -10px 50px -24px rgba(15, 23, 42, 0.14),
    inset 10px 8px 26px -14px rgba(243, 24, 32, 0.16);
}
.oi-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(100, 116, 139, 0.22) 1px, transparent 1.6px);
  background-size: 18px 18px;
  -webkit-mask-image: radial-gradient(60% 80% at 78% 55%, black 0%, transparent 75%);
  mask-image: radial-gradient(60% 80% at 78% 55%, black 0%, transparent 75%);
}
.oi-calm {
  position: absolute;
  inset: 0;
  background: radial-gradient(50% 72% at 26% 50%, rgba(250, 251, 252, 0.8) 0%, rgba(250, 251, 252, 0.5) 55%, rgba(250, 251, 252, 0) 100%);
}
@media (max-width: 767px) {
  .oi-sheet-a { left: -40%; top: 62%; width: 190%; }
  .oi-sheet-b { left: 20%; top: -70%; width: 150%; }
  .oi-sheet-c { left: 62%; top: 55%; width: 110%; }
  .oi-dots {
    -webkit-mask-image: radial-gradient(80% 45% at 70% 100%, black 0%, transparent 75%);
    mask-image: radial-gradient(80% 45% at 70% 100%, black 0%, transparent 75%);
  }
  .oi-calm { background: radial-gradient(90% 60% at 40% 42%, rgba(250, 251, 252, 0.82) 0%, rgba(250, 251, 252, 0.5) 60%, rgba(250, 251, 252, 0) 100%); }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="oi-field relative overflow-hidden text-slate-900"
    >
      <style>{FIELD_CSS}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="oi-sheet oi-sheet-b rounded-[50%]" />
        <div className="oi-sheet oi-sheet-a rounded-[50%]" />
        <div className="oi-sheet oi-sheet-c rounded-[50%]" />
        <div className="oi-dots" />
        <div className="oi-calm" />
      </div>

      <div className="container-wide relative py-16 sm:py-20 xl:py-24">
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
