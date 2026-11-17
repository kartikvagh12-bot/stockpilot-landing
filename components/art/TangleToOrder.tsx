// The company hero's drawing: complex work becoming orderly.
//
// Six workflows enter from the left as irregular, crossing lines. They pass
// through a frame (the structure software gives them) and leave as evenly
// spaced parallel lanes on a measured grid, each ending at a fixed point. One
// workflow is traced in Operza red from tangle to order, so the eye can follow
// a single piece of work through the change.
//
// Static SVG with a one-time draw-in (.draw / .appear in globals.css), which
// collapses to the finished drawing under prefers-reduced-motion. Decorative:
// the hero's text carries the meaning, so the drawing is hidden from
// assistive tech.

// Where the lanes sit once they are orderly.
const LANES = [160, 212, 264, 316, 368, 420];
const RED_LANE = 2;

// Each tangled path ends exactly on its lane at the frame (x = 340).
const TANGLES = [
  "M0 70 C 90 40, 140 210, 210 170 S 290 120, 340 160",
  "M0 160 C 70 220, 150 60, 220 110 S 300 250, 340 212",
  "M0 250 C 80 180, 120 380, 200 320 S 262 190, 340 264",
  "M0 340 C 60 280, 170 460, 230 360 S 290 300, 340 316",
  "M0 430 C 110 470, 120 300, 210 400 S 300 440, 340 368",
  "M0 510 C 70 430, 160 520, 240 470 S 310 390, 340 420",
];

const FRAME_X = 346;
const END_X = 668;

export default function TangleToOrder({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 560"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* The tangle emerges out of the dark rather than starting at a
            hard edge. */}
        <linearGradient id="tto-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="tto-mask">
          <rect x="0" y="0" width="360" height="560" fill="url(#tto-fade)" />
        </mask>
      </defs>

      {/* The measured field on the orderly side: faint module lines. */}
      <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => FRAME_X + 40 + i * 36).map((x) => (
          <line key={x} x1={x} x2={x} y1="128" y2="452" className="appear" style={{ animationDelay: "1.1s" }} />
        ))}
      </g>

      {/* A dimension line across the orderly side, with end ticks. */}
      <g stroke="rgba(255,255,255,0.32)" strokeWidth="1" className="appear" style={{ animationDelay: "1.5s" }}>
        <line x1={FRAME_X + 12} x2={END_X} y1="104" y2="104" />
        <line x1={FRAME_X + 12} x2={FRAME_X + 12} y1="96" y2="112" />
        <line x1={END_X} x2={END_X} y1="96" y2="112" />
        <line x1={(FRAME_X + 12 + END_X) / 2} x2={(FRAME_X + 12 + END_X) / 2} y1="100" y2="108" />
      </g>

      {/* The tangle. */}
      <g mask="url(#tto-mask)" strokeWidth="1.4" strokeLinecap="round">
        {TANGLES.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            stroke={i === RED_LANE ? "#f31820" : "rgba(255,255,255,0.42)"}
            className="draw"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          />
        ))}
      </g>

      {/* The frame the work passes through. */}
      <g stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" className="appear" style={{ animationDelay: "0.9s" }}>
        <line x1={FRAME_X - 6} x2={FRAME_X - 6} y1="128" y2="452" />
        <line x1={FRAME_X + 6} x2={FRAME_X + 6} y1="128" y2="452" />
        <line x1={FRAME_X - 14} x2={FRAME_X + 14} y1="128" y2="128" />
        <line x1={FRAME_X - 14} x2={FRAME_X + 14} y1="452" y2="452" />
      </g>

      {/* Order: parallel lanes, each ending at a fixed point. */}
      <g strokeWidth="1.4" strokeLinecap="round">
        {LANES.map((y, i) => (
          <path
            key={y}
            d={`M${FRAME_X + 6} ${y} H ${END_X}`}
            pathLength={1}
            stroke={i === RED_LANE ? "#f31820" : "rgba(255,255,255,0.7)"}
            className="draw"
            style={{ animationDelay: `${1.25 + i * 0.07}s`, animationDuration: "1.1s" }}
          />
        ))}
      </g>
      <g>
        {LANES.map((y, i) => (
          <rect
            key={y}
            x={END_X - 4}
            y={y - 4}
            width="8"
            height="8"
            fill={i === RED_LANE ? "#f31820" : "#05070f"}
            stroke={i === RED_LANE ? "#f31820" : "rgba(255,255,255,0.8)"}
            strokeWidth="1.2"
            className="appear"
            style={{ animationDelay: `${2.1 + i * 0.05}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
