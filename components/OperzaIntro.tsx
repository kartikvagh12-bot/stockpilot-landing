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
// The background is an abstract relief of separate sculpted tiles: rounded
// pearl forms, like satin ceramic pieces, set at three depths on a light
// ground and spaced so no two overlap. They share one angle, so they read as
// a rhythm rather than a pile, and they gather to the right and lower right,
// clear of the copy.
//
// Depth comes from each tile's thickness and shadow, scaled by its layer:
// a stack of unblurred offset shadows stepping from pearl into slate
// extrudes a side face that follows its outline, a tight dark shadow at the
// rim adds contact occlusion, and a soft wider shadow lands on the ground.
// Deeper tiles are cooler, thinner and cast less; front tiles are brighter,
// thicker and cast more. Faces are lit from the upper front left, with a
// satin sheen and a crisp rim highlight. A soft red light sits in the gap
// between the front tiles, and the nearest faces catch a little of it,
// always weaker than the red in the copy. Static; CSS and DOM only (no
// canvas, SVG, image or dependency).

type Tile = {
  x: number; // centre, px from the right edge (negative = inward)
  y: number; // centre, px from the bottom edge (negative = upward)
  w: number;
  h: number;
  z: 1 | 2 | 3; // 1 back, 3 front
  red: boolean; // catches the red light on its lower face
  far: boolean; // only on very wide screens, where there is more room
};

// Tiles sit on a lattice turned to the shared angle, so every gap is even and
// no two tiles overlap. Cells that would reach toward the copy are left out:
// beside the copy on desktop (REACH from the right edge, more on very wide
// screens), and above the band under the copy on smaller screens (TOP).
const ANGLE = 16;
const PITCH_U = 236;
const PITCH_V = 158;

function lattice(reach: number, farReach: number, top: number, glow: [number, number]) {
  const a = (ANGLE * Math.PI) / 180;
  const eu = [Math.cos(a), -Math.sin(a)];
  const ev = [-Math.sin(a), -Math.cos(a)];
  const out: Tile[] = [];
  for (let j = 0; j < 4; j++) {
    for (let i = -9; i <= 1; i++) {
      const u = i * PITCH_U + (j % 2) * (PITCH_U / 2);
      const v = j * PITCH_V;
      const x = 30 + u * eu[0] + v * ev[0];
      const y = 40 + u * eu[1] + v * ev[1];
      const w = 196 - (((i + 2 * j) % 3) + 3) % 3 * 22;
      const h = Math.round(w * 0.62);
      const left = x - w / 2;
      if (left < -farReach || left > 40 || y + h / 2 < -560 || y - h / 2 < -top) continue;
      const z = (1 + ((((i * 2 + j) % 3) + 3) % 3)) as 1 | 2 | 3;
      out.push({ x: Math.round(x), y: Math.round(y), w, h, z, red: false, far: left < -reach });
    }
  }
  // The two tiles nearest the red light catch a little of it.
  [...out]
    .sort((p, q) => Math.hypot(p.x - glow[0], p.y - glow[1]) - Math.hypot(q.x - glow[0], q.y - glow[1]))
    .slice(0, 2)
    .forEach((t) => (t.red = true));
  return out;
}

// Desktop: the lower right beside the copy. Band: a strip under the copy.
const DESK_GLOW: [number, number] = [-250, -150];
const BAND_GLOW: [number, number] = [-420, -40];
const DESK = lattice(560, 780, 9999, DESK_GLOW);
const BAND = lattice(1500, 1500, 222, BAND_GLOW);

const SIDE_FROM = [236, 240, 244];
const SIDE_TO = [150, 162, 176];
const DEPTH = { 1: 10, 2: 16, 3: 22 } as const;

function tileShadow(t: Tile) {
  const d = DEPTH[t.z];
  const dx = d * 0.55;
  const dy = d * 0.8;
  const steps = 10;
  const side = Array.from({ length: steps }, (_, i) => {
    const k = (i + 1) / steps;
    const c = SIDE_FROM.map((v, j) => Math.round(v + (SIDE_TO[j] - v) * k));
    return `${(dx * k).toFixed(1)}px ${(dy * k).toFixed(1)}px 0 rgb(${c.join(", ")})`;
  });
  const lift = 0.1 + 0.05 * t.z;
  return [
    "inset 2px 2px 0 rgba(255, 255, 255, 0.95)",
    "inset 10px 12px 20px -10px rgba(255, 255, 255, 0.9)",
    `inset -14px -16px 34px -18px rgba(100, 116, 139, ${0.22 + 0.04 * t.z})`,
    ...(t.red ? ["inset -6px -10px 22px -12px rgba(243, 24, 32, 0.2)"] : []),
    ...side,
    `${dx * 1.1}px ${dy * 1.15}px ${d * 0.4}px rgba(15, 23, 42, ${lift + 0.1})`,
    `${dx * 2}px ${dy * 2.2}px ${d * 1.8}px rgba(15, 23, 42, ${lift})`,
  ].join(", ");
}

const FACE = {
  1: "linear-gradient(150deg, #f3f6f8 0%, #e6ebf0 100%)",
  2: "linear-gradient(150deg, #f8fafb 0%, #eaeef2 100%)",
  3: "linear-gradient(150deg, #ffffff 0%, #eef2f5 100%)",
} as const;
const SHEEN =
  "radial-gradient(70% 60% at 30% 25%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%)";

const RELIEF_CSS = `
.oi-relief {
  --k: 1;
  background:
    radial-gradient(55% 70% at 18% 35%, #ffffff 0%, rgba(255, 255, 255, 0) 70%),
    radial-gradient(40% 60% at 90% 95%, #cbd2da 0%, rgba(203, 210, 218, 0) 75%),
    linear-gradient(165deg, #f7f9fa 0%, #eef1f4 55%, #e3e8ec 100%);
}
.oi-field {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  transform: scale(var(--k));
  transform-origin: 0 0;
}
.oi-tile {
  position: absolute;
  transform: translate(-50%, -50%) rotate(-${ANGLE}deg);
}
.oi-glow {
  position: absolute;
  width: 360px;
  height: 260px;
  transform: translate(-50%, -50%);
  background: radial-gradient(50% 50% at 50% 50%, rgba(243, 24, 32, 0.4) 0%, rgba(217, 13, 22, 0.14) 45%, rgba(217, 13, 22, 0) 75%);
}
.oi-band, .oi-tile-far { display: none; }
@media (min-width: 1800px) {
  .oi-relief { --k: 1.15; }
  .oi-tile-far { display: block; }
}
@media (max-width: 1279px) {
  .oi-relief { --k: 0.72; }
  .oi-band { display: block; }
  .oi-desk { display: none; }
}
@media (max-width: 767px) {
  .oi-relief { --k: 0.6; }
}
`;

function Field({ className, tiles, glow }: { className: string; tiles: Tile[]; glow: [number, number] }) {
  return (
    <div className={`oi-field ${className}`}>
      <div className="oi-glow" style={{ left: glow[0], top: glow[1] }} />
      {tiles.map((t, i) => (
        <div
          key={i}
          className={`oi-tile rounded-[38px]${t.far ? " oi-tile-far" : ""}`}
          style={{
            left: t.x,
            top: t.y,
            width: t.w,
            height: t.h,
            zIndex: t.z,
            background: `${SHEEN}, ${FACE[t.z]}`,
            boxShadow: tileShadow(t),
          }}
        />
      ))}
    </div>
  );
}

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="oi-relief relative overflow-hidden text-slate-900"
    >
      <style>{RELIEF_CSS}</style>
      <div className="pointer-events-none absolute inset-0">
        <Field className="oi-desk" tiles={DESK} glow={DESK_GLOW} />
        <Field className="oi-band" tiles={BAND} glow={BAND_GLOW} />
      </div>

      <div className="container-wide relative pt-14 pb-[150px] sm:pt-20 sm:pb-[170px] xl:py-24">
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
