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
// The background is one giant rounded body on a deep black ground: a point
// surface on an ellipsoid, seen from very close, cropped by the section so
// only its upper cap shows, rising from the bottom right. The points are computed here, at build time, from
// real 3D geometry (see BODY below); nothing is random. Every point is drawn
// as one entry in a single element's box-shadow list, so the whole body is
// one DOM node and one layer however many points it has. A soft red light
// sits inside the body as the one accent, and a dark falloff keeps the copy
// column quiet. CSS and DOM only: no canvas, SVG, image or dependency.
//
// Motion: the body turns by a couple of degrees and drifts a few pixels over
// a minute, and the red light drifts on its own slower cycle. The red light
// is a plain soft gradient with no blur filter: a filtered layer drifting
// over the point layer cost frames on large screens. Only whole
// layers move, never single points, transform only, so there is no layout
// shift. All of it stops under prefers-reduced-motion, here and in the global
// rule.
//
// The hero's red glow starts above its own top edge and is clipped there.
// With a dark block above, that clipped edge would show as a line, so the art
// is clipped inside its own layer and the section lays a short fade of the
// ground colour over the top of the hero's padding, which is taller than the
// fade, so it never reaches hero copy.

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
// highlight and the other falls into shadow. Opacity is that brightness,
// faded where the surface turns edge-on to the camera and where it falls away
// in depth. Points in shadow on the side facing RED_DIR take on a little of
// the logo red: light from inside the body showing through.
//
// Two views of the same body are precomputed, each cropped to what its layout
// actually shows, and each viewport renders only its own set. From 1280px the
// desktop body sits below the bottom right corner beside the copy, its upper
// cap rising into the section. It is placed from the copy column's right edge
// (the container edge plus 58rem), not the viewport's, so the gap between the
// text and its rim is the same at every width.
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
  // For the dark body behind the points: every front-facing point's projected
  // position (for the silhouette), and where the surface faces the light and
  // the red most directly (for its shading).
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
      const alpha =
        bright * smooth(0.02, 0.5, facing) * smooth(0.55, 1.35, depth);
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
      const rgb = [
        226 + (243 - 226) * red,
        232 + (24 - 232) * red,
        240 + (32 - 240) * red,
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
// ellipse, so rather than trace the rim point by point, fit that ellipse: take
// the convex hull of the projected front-facing points, find its principal
// axes, and measure the hull's full extent along each. The body is then drawn
// as a rotated, fully rounded box, which gives a perfectly smooth silhouette.
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

// The dark body under the points, per view: the fitted silhouette ellipse,
// shaded as matte graphite lit from the same light as the points, with the
// red light inside it where the visible surface faces RED_DIR most. Because
// the red is part of the body's own fill, it can only ever show inside the
// silhouette. Gradient centres are given in the ellipse box's own (unrotated)
// frame.
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
  const r = (f: number) => `${(Math.max(e.rx, e.ry) * f).toFixed(0)}px`;
  return {
    left: `${(e.cx - e.rx).toFixed(1)}px`,
    top: `${(e.cy - e.ry).toFixed(1)}px`,
    width: `${(2 * e.rx).toFixed(1)}px`,
    height: `${(2 * e.ry).toFixed(1)}px`,
    transform: `rotate(${e.angle.toFixed(2)}deg)`,
    background: [
      `radial-gradient(${r(0.4)} ${r(0.26)} at ${local(view.glow.x, view.glow.y)}, rgba(243, 24, 32, 0.4) 0%, rgba(217, 13, 22, 0.15) 45%, rgba(217, 13, 22, 0) 100%)`,
      `radial-gradient(${r(1.25)} ${r(1.25)} at ${local(view.lit.x, view.lit.y)}, #4b515b 0%, #30343c 22%, #1b1e24 50%, #101217 78%, #0a0b0e 100%)`,
    ].join(", "),
  };
}

const DESKTOP = buildBody(BODY, { focal: 1100, crop: [-1500, 420, -860, -230] });
const PHONE = buildBody(BODY, { focal: 560, crop: [-340, 90, -420, -110] });
const DESKTOP_BODY = bodyStyle(DESKTOP);
const PHONE_BODY = bodyStyle(PHONE);

const SCENE_CSS = `
.oi-ground {
  background:
    radial-gradient(60% 85% at 10% 8%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 60%),
    radial-gradient(45% 75% at 90% 100%, rgba(100, 116, 139, 0.16) 0%, rgba(100, 116, 139, 0) 70%),
    linear-gradient(180deg, #f6f8fa 0%, #eef2f5 60%, #e6ebf0 100%);
}
.oi-body {
  position: absolute;
  width: 0;
  height: 0;
}
.oi-body-desktop {
  left: calc(max(0px, (100% - 88rem) / 2) + 58rem + 550px);
  top: calc(100% + 250px);
}
.oi-body-phone {
  display: none;
  left: 80%;
  top: calc(100% + 182px);
}
.oi-shadow {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 24px 48px rgba(15, 23, 42, 0.28)) drop-shadow(0 4px 10px rgba(15, 23, 42, 0.18));
}
.oi-backing {
  position: absolute;
}
.oi-points {
  position: absolute;
  left: -1px;
  top: -1px;
  width: 2px;
  height: 2px;
}
@keyframes oiTurn {
  from { transform: rotate(-1.5deg) translate3d(-3px, 2px, 0); }
  to { transform: rotate(1.5deg) translate3d(3px, -2px, 0); }
}
.oi-move-body { animation: oiTurn 56s ease-in-out infinite alternate; }
@media (min-width: 1800px) {
  .oi-body-desktop { left: calc(max(0px, (100% - 88rem) / 2) + 58rem + 646px); transform: scale(1.12); }
}
@media (min-width: 768px) and (max-width: 1279px) {
  .oi-body-desktop { left: calc(100% - 60px); top: calc(100% + 322px); transform: scale(0.7); }
}
@media (max-width: 767px) {
  .oi-body-desktop { display: none; }
  .oi-body-phone { display: block; }
  .oi-ground {
    background:
      radial-gradient(90% 50% at 20% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%),
      linear-gradient(180deg, #f6f8fa 0%, #eef2f5 60%, #e6ebf0 100%);
  }
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
            <div className="oi-shadow">
              <div className="oi-backing rounded-full" style={DESKTOP_BODY} />
            </div>
            <div
              className="oi-points rounded-full"
              style={{ boxShadow: DESKTOP.points }}
            />
          </div>
        </div>
        <div className="oi-body oi-body-phone">
          <div className="oi-move-body absolute inset-0">
            <div className="oi-shadow">
              <div className="oi-backing rounded-full" style={PHONE_BODY} />
            </div>
            <div
              className="oi-points rounded-full"
              style={{ boxShadow: PHONE.points }}
            />
          </div>
        </div>
      </div>

      <div className="container-wide relative pt-10 pb-52 sm:pt-16 xl:py-20">
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
