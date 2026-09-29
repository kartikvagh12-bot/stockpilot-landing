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
// cap rising into the section, sized per width so its rim clears the text.
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
      const depth = o.cam / (o.cam - point[2]);
      const lambert = Math.max(0, dot(normal, light));
      const bright = o.base + (1 - o.base) * lambert ** 1.3;
      const alpha =
        bright * smooth(0.02, 0.5, facing) * smooth(0.55, 1.35, depth);
      if (alpha < 0.04) continue;
      const sx = point[0] * scale;
      const sy = point[1] * scale;
      if (sx < left || sx > right || sy < top || sy > bottom) continue;

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
  return shadows.join(",");
}

const DESKTOP = buildBody(BODY, { focal: 1100, crop: [-1500, 80, -860, -230] });
const PHONE = buildBody(BODY, { focal: 560, crop: [-340, 90, -420, -110] });

const SCENE_CSS = `
.oi-ground {
  background:
    radial-gradient(55% 85% at 86% 100%, rgba(22, 25, 33, 0.85) 0%, rgba(12, 14, 19, 0.55) 45%, rgba(3, 4, 8, 0) 80%),
    radial-gradient(30% 50% at 70% 88%, rgba(120, 10, 16, 0.14) 0%, rgba(120, 10, 16, 0) 70%),
    linear-gradient(180deg, #030408 0%, #020305 100%);
}
.oi-body {
  position: absolute;
  width: 0;
  height: 0;
}
.oi-body-desktop {
  left: calc(100% - 20px);
  top: calc(100% + 250px);
}
.oi-body-phone {
  display: none;
  left: 80%;
  top: calc(100% + 150px);
}
.oi-points {
  position: absolute;
  left: -1px;
  top: -1px;
  width: 2px;
  height: 2px;
}
.oi-core {
  position: absolute;
  background: radial-gradient(50% 50% at 50% 50%, rgba(243, 24, 32, 0.26) 0%, rgba(217, 13, 22, 0.12) 38%, rgba(217, 13, 22, 0.04) 62%, rgba(217, 13, 22, 0) 80%);
}
.oi-body-desktop .oi-core { left: -620px; top: -560px; width: 620px; height: 360px; }
.oi-body-phone .oi-core { left: -340px; top: -330px; width: 420px; height: 260px; }
.oi-scrim {
  background: radial-gradient(46% 95% at 18% 46%, rgba(2, 3, 5, 0.95) 0%, rgba(2, 3, 5, 0.88) 58%, rgba(2, 3, 5, 0) 90%);
}
@keyframes oiTurn {
  from { transform: rotate(-1.5deg) translate3d(-3px, 2px, 0); }
  to { transform: rotate(1.5deg) translate3d(3px, -2px, 0); }
}
@keyframes oiCore {
  from { transform: translate3d(-12px, 6px, 0); }
  to { transform: translate3d(12px, -6px, 0); }
}
.oi-move-body { animation: oiTurn 56s ease-in-out infinite alternate; }
.oi-move-core { animation: oiCore 38s ease-in-out infinite alternate; }
@media (min-width: 1800px) {
  .oi-body-desktop { transform: scale(1.12); }
}
@media (min-width: 1280px) and (max-width: 1599px) {
  .oi-body-desktop { left: calc(100% + 90px); transform: scale(0.9); }
}
@media (min-width: 768px) and (max-width: 1279px) {
  .oi-body-desktop { left: calc(100% - 60px); top: calc(100% + 290px); transform: scale(0.7); }
  .oi-body-desktop .oi-core { top: -520px; }
}
@media (max-width: 1279px) {
  .oi-scrim {
    background: linear-gradient(180deg, rgba(2, 3, 5, 0.95) 0%, rgba(2, 3, 5, 0.9) calc(100% - 250px), rgba(2, 3, 5, 0) calc(100% - 150px));
  }
}
@media (max-width: 767px) {
  .oi-body-desktop { display: none; }
  .oi-body-phone { display: block; }
  .oi-ground {
    background:
      radial-gradient(90% 40% at 80% 100%, rgba(22, 25, 33, 0.85) 0%, rgba(12, 14, 19, 0.5) 50%, rgba(3, 4, 8, 0) 85%),
      linear-gradient(180deg, #030408 0%, #020305 100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .oi-move-body, .oi-move-core { animation: none; }
}
`;

export default function OperzaIntro() {
  return (
    <section
      aria-labelledby="operza-intro-label"
      className="relative z-10 bg-[#030408] text-white"
    >
      <style>{SCENE_CSS}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="oi-ground absolute inset-0" />
        <div className="oi-body oi-body-desktop">
          <div className="oi-core oi-move-core" />
          <div className="oi-move-body absolute inset-0">
            <div
              className="oi-points rounded-full"
              style={{ boxShadow: DESKTOP }}
            />
          </div>
        </div>
        <div className="oi-body oi-body-phone">
          <div className="oi-core oi-move-core" />
          <div className="oi-move-body absolute inset-0">
            <div
              className="oi-points rounded-full"
              style={{ boxShadow: PHONE }}
            />
          </div>
        </div>
        <div className="oi-scrim absolute inset-0" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-full h-12 bg-gradient-to-b from-[#030408] to-transparent" />

      <div className="container-wide relative pt-10 pb-60 sm:pt-16 xl:py-20">
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
