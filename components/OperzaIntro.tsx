// Orientation before the hero. A cold visitor meets the hero's headline about
// what Operza lets them run before anything has said what Operza is, so this
// defines the software first. It does not explain the plans: Factory, Books
// and Complete are covered further down the page. It is an introduction, not
// a feature section: no CTA, no card behind the copy. The hero stays the main
// marketing statement and keeps the page's only h1.
//
// The copy is dark slate on a light ground. Red is carried by text alone: the
// label and one short phrase in the definition, both brand-600, which holds AA
// contrast on this ground. No ornament before the label. No heading element on
// purpose: a heading ahead of the page's h1 would make the outline read
// backwards. The label names the section through aria-labelledby.
//
// The background is one scene lit from the upper left. A pearl room brightens
// toward the copy and deepens through silver into graphite toward the lower
// right, where a very large rounded body, a point surface on an ellipsoid seen
// from close up, rises out of it. The body has no hard edge: its volume is a
// set of soft gradients that fade to nothing before the rim, and its dotted
// rows turn from silver over the dark core to slate where the room shows
// through, so the rows themselves draw the curve. A faint red light sits
// inside the body. A soft pearl falloff behind the copy keeps the text clear;
// the body is placed so no point lands in a line of text at any width.
//
// The points are computed here, at build time, from real 3D geometry (see
// BODY below); nothing is random. Every point is one entry in a single
// element's box-shadow list, so the body is one DOM node and one layer however
// many points it has. CSS and DOM only: no canvas, SVG, image or dependency.
//
// Motion: the whole body (volume and points together) turns by a couple of
// degrees and drifts a few pixels over a minute. Nothing else moves and no
// blur filter is animated. Transform only, so there is no layout shift, and
// it stops under prefers-reduced-motion, here and in the global rule.
//
// The section meets the dark hero at a clean light-to-dark edge; the hero is
// not changed.

// ---------------------------------------------------------------------------
// The body. An ellipsoid with radii RX, RY, RZ, sampled on latitude bands
// every LAT_STEP degrees (phi from LAT_FROM to LAT_TO) with LON points around
// each band (theta over the full circle):
//
//   x = RX sin(phi) cos(theta)
//   y = RY cos(phi)
//   z = RZ sin(phi) sin(theta)
//
// The bands are sampled much more finely around the ring than between rings,
// so each latitude reads as a continuous dotted curve wrapping the body. Every
// ring has the same number of points, so points at the same theta line up
// into meridians; every MERIDIAN_EVERY-th one is a touch larger and brighter,
// which makes the second curvature legible without adding points.
//
// The body is turned (YAW about y, PITCH about x, ROLL about z) so the rings
// sweep across it. y points down the screen and z toward the viewer.
//
// Projection is a pinhole camera CAM units in front of the centre with focal
// length FOCAL: a point at depth z lands at (x, y) * FOCAL / (CAM - z). Depth
// relative to the body's centre, (CAM / (CAM - z)), drives size and fade, so
// near points are larger and far points shrink and dim as the surface rolls
// away, whatever size the body is drawn at.
//
// Each point's surface normal is the ellipsoid gradient (x/RX², y/RY², z/RZ²),
// turned with the body. Points whose normal faces away from the camera are
// dropped (the far side). Brightness is the Lambert term of the normal against
// LIGHT (upper left, toward the viewer), so one side catches a soft silver
// highlight and the other falls into shadow. Toward the rim, where the surface
// turns edge-on, points shift from silver to slate and hold a steady opacity,
// so the rows stay legible against the light room. Points in shadow on the
// side facing RED_DIR take on a little red: light from inside the body.
//
// Two views of the same body are precomputed, each cropped to what its layout
// actually shows, and each viewport renders only its own set. From 1280px the
// desktop body sits below the bottom right corner beside the copy. It is
// placed from the copy column's right edge (the container edge plus 58rem),
// not the viewport's, so its relation to the text is the same at every width.
// Below 1280px the copy is too wide to sit beside it, so the section gains a
// bottom band and the body rises into that band under the copy: the desktop
// view on tablets, the phone view below 768px.
// ---------------------------------------------------------------------------

const BODY = {
  rx: 900,
  ry: 820,
  rz: 900,
  latFrom: 1,
  latTo: 179,
  latStep: 3,
  lon: 300,
  meridianEvery: 12,
  yaw: -34,
  pitch: 28,
  roll: -22,
  cam: 1600,
  light: [-0.55, -0.65, 0.55],
  redDir: [-0.25, 0.85, 0.45],
  base: 0.1,
  minSize: 1.2,
  sizeGain: 1.6,
  accentSize: 0.5,
  accentGain: 1.45,
  maxSize: 4.2,
  redGain: 1.1,
};

type Vec = [number, number, number];
type View = { focal: number; crop: [number, number, number, number] };

function buildBody(o: typeof BODY, view: View) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const norm = (v: Vec): Vec => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  const [ay, ax, az] = [rad(o.yaw), rad(o.pitch), rad(o.roll)];
  const turn = ([x0, y0, z0]: Vec): Vec => {
    const x1 = x0 * Math.cos(ay) + z0 * Math.sin(ay);
    const z1 = -x0 * Math.sin(ay) + z0 * Math.cos(ay);
    const y2 = y0 * Math.cos(ax) - z1 * Math.sin(ax);
    const z2 = y0 * Math.sin(ax) + z1 * Math.cos(ax);
    const x3 = x1 * Math.cos(az) - y2 * Math.sin(az);
    const y3 = x1 * Math.sin(az) + y2 * Math.cos(az);
    return [x3, y3, z2];
  };
  const light = norm(o.light as Vec);
  const redDir = norm(o.redDir as Vec);
  const [left, right, top, bottom] = view.crop;
  const shadows: string[] = [];
  // For the soft volume behind the points: every front-facing point's projected
  // position (to fit the silhouette), and where the surface faces the light
  // and, among visible points, the red most directly (for its shading).
  const rim: [number, number][] = [];
  let lit = { k: -1, x: 0, y: 0 };
  let glow = { k: -1, x: 0, y: 0 };

  for (let phi = o.latFrom; phi <= o.latTo + 1e-6; phi += o.latStep) {
    for (let i = 0; i < o.lon; i++) {
      const p = rad(phi);
      const t = rad((360 / o.lon) * i);
      const local: Vec = [
        o.rx * Math.sin(p) * Math.cos(t),
        o.ry * Math.cos(p),
        o.rz * Math.sin(p) * Math.sin(t),
      ];
      const point = turn(local);
      const normal = norm(
        turn([
          local[0] / (o.rx * o.rx),
          local[1] / (o.ry * o.ry),
          local[2] / (o.rz * o.rz),
        ]),
      );
      const toCamera = norm([-point[0], -point[1], o.cam - point[2]]);
      const facing = dot(normal, toCamera);
      if (facing <= 0.02) continue;

      const scale = view.focal / (o.cam - point[2]);
      const px = point[0] * scale;
      const py = point[1] * scale;
      rim.push([px, py]);
      const kLit = dot(normal, light);
      if (kLit > lit.k) lit = { k: kLit, x: px, y: py };

      const depth = o.cam / (o.cam - point[2]);
      const lambert = Math.max(0, dot(normal, light));
      const bright = o.base + (1 - o.base) * lambert ** 1.3;
      // Silver where the body faces the viewer over its dark core, turning to
      // slate toward the rim, where the room shows through: the rows stay
      // visible all the way round and draw the curve without an edge.
      const edge = 1 - smooth(0.12, 0.55, facing);
      const alpha =
        (bright * smooth(0.55, 1.35, depth) * (1 - edge) + 0.5 * edge) *
        smooth(0, 0.12, facing);
      if (alpha < 0.04) continue;
      const sx = px;
      const sy = py;
      if (sx < left || sx > right || sy < top || sy > bottom) continue;
      const kRed = dot(normal, redDir);
      if (kRed > glow.k) glow = { k: kRed, x: sx, y: sy };

      const accent = i % o.meridianEvery === 0;
      const size = Math.min(
        o.maxSize,
        (o.minSize + o.sizeGain * bright + (accent ? o.accentSize : 0)) * depth,
      );
      const red = Math.min(
        0.7,
        (1 - lambert) ** 1.5 * Math.max(0, dot(normal, redDir)) * o.redGain,
      );
      const base = [
        226 + (100 - 226) * edge,
        232 + (116 - 232) * edge,
        240 + (139 - 240) * edge,
      ];
      const rgb = [
        base[0] + (243 - base[0]) * red,
        base[1] + (24 - base[1]) * red,
        base[2] + (32 - base[2]) * red,
      ].map(Math.round);
      const a = Math.min(1, alpha * (accent ? o.accentGain : 1));

      shadows.push(
        `${sx.toFixed(1)}px ${sy.toFixed(1)}px 0 ${(size / 2 - 1).toFixed(2)}px rgba(${rgb.join(",")},${a.toFixed(2)})`,
      );
    }
  }
  return { points: shadows.join(","), outline: hull(rim), lit, glow };
}

// The silhouette. The perspective projection of an ellipsoid is itself an
// ellipse, so fit that ellipse rather than trace the rim point by point: take
// the convex hull of the projected front-facing points, find its principal
// axes, and measure the hull's full extent along each. It sizes and orients
// the body's soft volume (see bodyStyle); it is never drawn as an edge.
function hull(pts: [number, number][]) {
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: [number, number][]) => {
    const out: [number, number][] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  const ring = half(sorted).concat(half([...sorted].reverse()));
  const mx = ring.reduce((a, p) => a + p[0], 0) / ring.length;
  const my = ring.reduce((a, p) => a + p[1], 0) / ring.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of ring) {
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
    sxy += (x - mx) * (y - my);
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const [c, sn] = [Math.cos(angle), Math.sin(angle)];
  const u = ring.map(([x, y]) => x * c + y * sn);
  const v = ring.map(([x, y]) => -x * sn + y * c);
  const [u0, u1, v0, v1] = [Math.min(...u), Math.max(...u), Math.min(...v), Math.max(...v)];
  const cu = (u0 + u1) / 2;
  const cv = (v0 + v1) / 2;
  return {
    cx: cu * c - cv * sn,
    cy: cu * sn + cv * c,
    rx: (u1 - u0) / 2 + 1,
    ry: (v1 - v0) / 2 + 1,
    angle: (angle * 180) / Math.PI,
  };
}

// The body's volume, per view. There is no solid disc: the fitted silhouette
// ellipse only sizes a box of soft gradients, all of which fade to nothing
// before its rim (closest-side), so the body dissolves into the room around
// it. It is darkest on the side turned away from the light, lighter toward the
// lit near side, and carries the red light inside it where the visible
// surface faces RED_DIR most. Gradient centres are in the box's own
// (unrotated) frame.
function bodyStyle(view: ReturnType<typeof buildBody>) {
  const e = view.outline;
  const a = (e.angle * Math.PI) / 180;
  const local = (x: number, y: number) => {
    const dx = x - e.cx;
    const dy = y - e.cy;
    const lx = dx * Math.cos(a) + dy * Math.sin(a) + e.rx;
    const ly = -dx * Math.sin(a) + dy * Math.cos(a) + e.ry;
    return `${lx.toFixed(0)}px ${ly.toFixed(0)}px`;
  };
  const far = local(e.cx + (e.cx - view.lit.x) * 0.7, e.cy + (e.cy - view.lit.y) * 0.7);
  const r = (f: number) => `${(Math.max(e.rx, e.ry) * f).toFixed(0)}px`;
  return {
    left: `${(e.cx - e.rx).toFixed(1)}px`,
    top: `${(e.cy - e.ry).toFixed(1)}px`,
    width: `${(2 * e.rx).toFixed(1)}px`,
    height: `${(2 * e.ry).toFixed(1)}px`,
    transform: `rotate(${e.angle.toFixed(2)}deg)`,
    background: [
      `radial-gradient(${r(0.34)} ${r(0.22)} at ${local(view.glow.x, view.glow.y)}, rgba(243, 24, 32, 0.34) 0%, rgba(217, 13, 22, 0.12) 50%, rgba(217, 13, 22, 0) 100%)`,
      `radial-gradient(${r(1.05)} ${r(1.05)} at ${far}, rgba(8, 9, 12, 0.92) 0%, rgba(14, 16, 20, 0.78) 35%, rgba(24, 27, 33, 0.4) 65%, rgba(24, 27, 33, 0) 100%)`,
      `radial-gradient(closest-side at 50% 50%, rgba(30, 34, 41, 0.9) 0%, rgba(38, 43, 51, 0.78) 55%, rgba(52, 58, 68, 0.45) 80%, rgba(70, 77, 88, 0) 100%)`,
    ].join(", "),
  };
}

const DESKTOP = buildBody(BODY, { focal: 1250, crop: [-860, 440, -780, -200] });
const PHONE = buildBody(BODY, { focal: 640, crop: [-460, 140, -560, -80] });
const DESKTOP_BODY = bodyStyle(DESKTOP);
const PHONE_BODY = bodyStyle(PHONE);

const SCENE_CSS = `
.oi-ground {
  background:
    radial-gradient(55% 90% at 8% 10%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 62%),
    radial-gradient(60% 110% at 100% 100%, rgba(22, 25, 31, 0.55) 0%, rgba(40, 46, 55, 0.28) 45%, rgba(60, 68, 80, 0) 80%),
    radial-gradient(55% 90% at 72% 55%, rgba(148, 160, 176, 0.32) 0%, rgba(148, 160, 176, 0) 70%),
    radial-gradient(30% 45% at 78% 96%, rgba(190, 24, 32, 0.1) 0%, rgba(190, 24, 32, 0) 70%),
    linear-gradient(100deg, #f7f9fb 0%, #f2f5f7 40%, #e9eef2 65%, #dfe5ea 100%);
}
.oi-body {
  position: absolute;
  width: 0;
  height: 0;
}
.oi-body-desktop {
  left: calc(max(0px, (100% - 88rem) / 2) + 58rem + 600px);
  top: calc(100% + 260px);
}
.oi-body-phone {
  display: none;
  left: 86%;
  top: calc(100% + 262px);
}
.oi-volume {
  position: absolute;
  -webkit-mask-image: radial-gradient(closest-side, black 55%, transparent 100%);
  mask-image: radial-gradient(closest-side, black 55%, transparent 100%);
}
.oi-points {
  position: absolute;
  left: -1px;
  top: -1px;
  width: 2px;
  height: 2px;
}
.oi-read {
  background: radial-gradient(54% 80% at 24% 52%, rgba(246, 248, 250, 0.94) 0%, rgba(246, 248, 250, 0.86) 55%, rgba(246, 248, 250, 0) 100%);
}
@keyframes oiTurn {
  from { transform: rotate(-1.5deg) translate3d(-3px, 2px, 0); }
  to { transform: rotate(1.5deg) translate3d(3px, -2px, 0); }
}
.oi-move-body { animation: oiTurn 56s ease-in-out infinite alternate; }
@media (min-width: 1800px) {
  .oi-body-desktop { left: calc(max(0px, (100% - 88rem) / 2) + 58rem + 726px); transform: scale(1.12); }
}
@media (min-width: 768px) and (max-width: 1279px) {
  .oi-body-desktop { left: calc(100% - 10px); top: calc(100% + 490px); transform: scale(0.85); }
  .oi-read { background: linear-gradient(180deg, rgba(246, 248, 250, 0.9) 0%, rgba(246, 248, 250, 0.8) calc(100% - 200px), rgba(246, 248, 250, 0) calc(100% - 100px)); }
}
@media (max-width: 767px) {
  .oi-body-desktop { display: none; }
  .oi-body-phone { display: block; }
  .oi-ground {
    background:
      radial-gradient(90% 55% at 15% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%),
      radial-gradient(110% 45% at 100% 100%, rgba(22, 25, 31, 0.5) 0%, rgba(40, 46, 55, 0.25) 50%, rgba(60, 68, 80, 0) 85%),
      radial-gradient(60% 25% at 70% 98%, rgba(190, 24, 32, 0.1) 0%, rgba(190, 24, 32, 0) 70%),
      linear-gradient(180deg, #f7f9fb 0%, #f2f5f7 45%, #e9eef2 75%, #dfe5ea 100%);
  }
  .oi-read { background: linear-gradient(180deg, rgba(246, 248, 250, 0.9) 0%, rgba(246, 248, 250, 0.82) calc(100% - 180px), rgba(246, 248, 250, 0) calc(100% - 90px)); }
}
@media (prefers-reduced-motion: reduce) {
  .oi-move-body { animation: none; }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative bg-[#eef2f5] text-slate-900"
    >
      <style>{SCENE_CSS}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="oi-ground absolute inset-0" />
        <div className="oi-body oi-body-desktop">
          <div className="oi-move-body absolute inset-0">
            <div className="oi-volume" style={DESKTOP_BODY} />
            <div
              className="oi-points rounded-full"
              style={{ boxShadow: DESKTOP.points }}
            />
          </div>
        </div>
        <div className="oi-body oi-body-phone">
          <div className="oi-move-body absolute inset-0">
            <div className="oi-volume" style={PHONE_BODY} />
            <div
              className="oi-points rounded-full"
              style={{ boxShadow: PHONE.points }}
            />
          </div>
        </div>
        <div className="oi-read absolute inset-0" />
      </div>

      <div className="container-wide relative pt-10 pb-44 sm:pt-16 xl:py-20">
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
