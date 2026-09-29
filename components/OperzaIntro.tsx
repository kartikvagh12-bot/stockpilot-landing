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
// The background is an abstract relief: a few very large curved forms at
// different depths, like thick sculpted surfaces in soft light, flowing
// across the whole section. Nothing in it is an object or a space.
//
// Depth, back to front: the pearl ground, which falls to cool slate in the
// deepest gaps at the lower right; a midground form rising from the lower
// right; and two foreground forms, one sweeping down from the upper right
// and one broad low swell under the copy. Each form is solid, with a real
// thickness: a stack of unblurred offset shadows in stepped slate tones
// extrudes a shaded side face that follows its curve, and a wide soft shadow
// beneath it lands on whatever it covers, so the foreground visibly occludes
// the midground. Faces are lit from the upper front left, with a highlight on
// the near rim and shade along the far rim, so the curves read as volume.
//
// The one red light sits deep under the upper foreground form and leaks out
// of the gap onto the surfaces beside it. Behind the copy the same field
// continues, lit more evenly and with gentler edges, so the text reads first
// and the relief grows toward the right. Static; CSS and DOM only (no canvas,
// SVG, image or dependency).

// Thickness: solid offset shadows stepping from the face colour into slate,
// then the soft contact shadow the form casts on the layer beneath it.
const SIDE_FROM = [232, 236, 241];
const SIDE_TO = [166, 177, 190];
const extrude = (dx: number, dy: number, cast: number) =>
  [
    ...Array.from({ length: 12 }, (_, i) => {
      const t = (i + 1) / 12;
      const c = SIDE_FROM.map((v, k) => Math.round(v + (SIDE_TO[k] - v) * t));
      return `${(dx * t).toFixed(1)}px ${(dy * t).toFixed(1)}px 0 rgb(${c.join(", ")})`;
    }),
    `${dx * 1.6}px ${dy * 1.9}px ${cast}px rgba(15, 23, 42, 0.2)`,
    `${dx * 2.6}px ${dy * 3}px ${cast * 2.2}px rgba(15, 23, 42, 0.1)`,
  ].join(", ");

const FACE_LIGHT =
  "inset 6px 8px 14px -4px rgba(255, 255, 255, 0.95), inset -26px -30px 60px -24px rgba(100, 116, 139, 0.28)";

const RELIEF_CSS = `
.oi-relief {
  background:
    radial-gradient(55% 70% at 20% 30%, #ffffff 0%, rgba(255, 255, 255, 0) 70%),
    radial-gradient(45% 60% at 92% 92%, #a3adb9 0%, #c8d0d8 45%, rgba(200, 208, 216, 0) 80%),
    linear-gradient(165deg, #f7f9fa 0%, #eef1f4 50%, #dfe4e9 100%);
}
.oi-form {
  position: absolute;
}
.oi-glow {
  position: absolute;
  left: 60%;
  top: -10%;
  width: 46%;
  height: 70%;
  background: radial-gradient(40% 45% at 55% 55%, rgba(243, 24, 32, 0.26) 0%, rgba(217, 13, 22, 0.08) 45%, rgba(217, 13, 22, 0) 75%);
}
.oi-mid {
  left: 46%;
  top: 48%;
  width: 1100px;
  height: 760px;
  transform: rotate(-16deg);
  background: linear-gradient(160deg, #fbfcfd 0%, #eef2f5 45%, #dde3e9 100%);
  box-shadow: ${FACE_LIGHT}, ${extrude(-14, -18, 30)};
}
.oi-front-a {
  left: 66%;
  top: -118%;
  width: 1000px;
  height: 820px;
  transform: rotate(24deg);
  background: linear-gradient(200deg, #eef2f5 0%, #f7f9fa 55%, #ffffff 100%);
  box-shadow: inset -8px 10px 16px -6px rgba(255, 255, 255, 0.95), inset 30px -34px 70px -30px rgba(100, 116, 139, 0.3), ${extrude(-16, 22, 34)};
}
.oi-front-b {
  left: -30%;
  top: 86%;
  width: 1500px;
  height: 700px;
  transform: rotate(-5deg);
  background: linear-gradient(175deg, #ffffff 0%, #f4f6f8 40%, #e9edf1 100%);
  box-shadow: ${FACE_LIGHT}, ${extrude(10, -14, 36)};
}
.oi-calm {
  position: absolute;
  inset: 0;
  background: radial-gradient(48% 70% at 25% 48%, rgba(250, 251, 252, 0.72) 0%, rgba(250, 251, 252, 0.45) 55%, rgba(250, 251, 252, 0) 100%);
}
@media (max-width: 1279px) {
  .oi-mid { left: 40%; top: 58%; }
  .oi-front-a { left: 72%; top: -126%; }
  .oi-front-b { top: 90%; }
}
@media (max-width: 767px) {
  .oi-front-a { display: none; }
  .oi-glow { left: 20%; top: calc(100% - 150px); width: 100%; height: 150px; }
  .oi-mid { left: 38%; top: calc(100% - 118px); width: 620px; height: 460px; transform: rotate(-10deg); }
  .oi-front-b { left: -70%; top: calc(100% - 58px); width: 760px; height: 420px; transform: rotate(-3deg); }
  .oi-calm { background: radial-gradient(90% 55% at 40% 40%, rgba(250, 251, 252, 0.78) 0%, rgba(250, 251, 252, 0.45) 60%, rgba(250, 251, 252, 0) 100%); }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="oi-relief relative overflow-hidden text-slate-900"
    >
      <style>{RELIEF_CSS}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="oi-glow" />
        <div className="oi-form oi-mid rounded-full" />
        <div className="oi-form oi-front-a rounded-full" />
        <div className="oi-form oi-front-b rounded-full" />
        <div className="oi-calm" />
      </div>

      <div className="container-wide relative pt-14 pb-[136px] sm:py-20 xl:py-24">
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
