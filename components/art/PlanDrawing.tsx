// An architectural plan for Operza Linspace: the kind of drawing construction
// information starts from. Structural grid axes with their bubbles, double-line
// walls, door swings, columns and dimension strings, drawn in quiet white.
//
// One room is traced in Operza red, with its own dimension line: the idea of a
// quantity taken off a drawing. It is a drawing, not a product screen. There
// are no figures, no interface and nothing that implies the software exists to
// use today.
//
// Decorative and static apart from a one-time draw-in that collapses under
// prefers-reduced-motion, so it is hidden from assistive tech.

const AX = [96, 256, 416, 576]; // grid A to D
const AY = [100, 240, 380]; // grid 1 to 3
const LETTERS = ["A", "B", "C", "D"];

const INK = "rgba(255,255,255,0.72)";
const FAINT = "rgba(255,255,255,0.2)";
const RED = "#f31820";

// Walls as double lines, 6 units thick. Each entry is one centreline segment.
const WALLS: Array<[number, number, number, number]> = [
  // outer shell
  [96, 100, 576, 100],
  [576, 100, 576, 380],
  [576, 380, 96, 380],
  [96, 380, 96, 100],
  // interior, with door openings left as gaps
  [256, 100, 256, 200],
  [256, 250, 256, 380],
  [256, 240, 380, 240],
  [430, 240, 576, 240],
  [416, 240, 416, 380],
];

function wall([x1, y1, x2, y2]: [number, number, number, number], i: number) {
  const vertical = x1 === x2;
  const o = 3;
  const a = vertical ? `M${x1 - o} ${y1} V ${y2}` : `M${x1} ${y1 - o} H ${x2}`;
  const b = vertical ? `M${x1 + o} ${y1} V ${y2}` : `M${x1} ${y1 + o} H ${x2}`;
  const delay = { animationDelay: `${0.15 + i * 0.06}s` };
  return (
    <g key={i}>
      <path d={a} pathLength={1} className="draw" style={delay} />
      <path d={b} pathLength={1} className="draw" style={delay} />
    </g>
  );
}

export default function PlanDrawing({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 470" className={className} fill="none" aria-hidden="true" focusable="false">
      {/* Grid axes and bubbles. */}
      <g stroke={FAINT} strokeWidth="1" strokeDasharray="3 7" className="appear">
        {AX.map((x) => (
          <line key={`x${x}`} x1={x} x2={x} y1="58" y2="404" />
        ))}
        {AY.map((y) => (
          <line key={`y${y}`} x1="62" x2="610" y1={y} y2={y} />
        ))}
      </g>
      <g className="appear" style={{ animationDelay: "0.2s" }}>
        {AX.map((x, i) => (
          <g key={`bx${x}`}>
            <circle cx={x} cy="36" r="13" stroke={FAINT} strokeWidth="1" />
            <text x={x} y="40.5" textAnchor="middle" fontSize="12" fontWeight="600" fill="rgba(255,255,255,0.5)">
              {LETTERS[i]}
            </text>
          </g>
        ))}
        {AY.map((y, i) => (
          <g key={`by${y}`}>
            <circle cx="40" cy={y} r="13" stroke={FAINT} strokeWidth="1" />
            <text x="40" y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="600" fill="rgba(255,255,255,0.5)">
              {i + 1}
            </text>
          </g>
        ))}
      </g>

      {/* Walls. */}
      <g stroke={INK} strokeWidth="1.2" strokeLinecap="square">
        {WALLS.map(wall)}
      </g>

      {/* Door swings at the two openings. */}
      <g stroke="rgba(255,255,255,0.45)" strokeWidth="1" className="appear" style={{ animationDelay: "1.1s" }}>
        <path d="M259 200 L299 200" />
        <path d="M299 200 A 40 40 0 0 1 259 240" strokeDasharray="2 4" />
        <path d="M380 243 L380 283" />
        <path d="M380 283 A 40 40 0 0 0 420 243" strokeDasharray="2 4" />
      </g>

      {/* Columns at grid intersections on the shell. */}
      <g fill="rgba(255,255,255,0.78)" className="appear" style={{ animationDelay: "0.9s" }}>
        {AX.flatMap((x) => [100, 380].map((y) => <rect key={`${x}-${y}`} x={x - 5} y={y - 5} width="10" height="10" />))}
      </g>

      {/* Overall dimension string along the bottom. */}
      <g stroke="rgba(255,255,255,0.35)" strokeWidth="1" className="appear" style={{ animationDelay: "1.3s" }}>
        <line x1="96" x2="576" y1="440" y2="440" />
        {AX.map((x) => (
          <line key={`t${x}`} x1={x - 5} x2={x + 5} y1="445" y2="435" />
        ))}
      </g>

      {/* The takeoff: one room traced in red, measured on its own line. */}
      <g stroke={RED} strokeWidth="1.6" strokeLinejoin="round">
        <path
          d="M422 246 H 570 V 374 H 422 Z"
          pathLength={1}
          className="draw"
          style={{ animationDelay: "1.5s", animationDuration: "1.4s" }}
        />
        <g className="appear" style={{ animationDelay: "2.6s" }} strokeWidth="1.2">
          <line x1="422" x2="570" y1="414" y2="414" />
          <line x1="417" x2="427" y1="419" y2="409" />
          <line x1="565" x2="575" y1="419" y2="409" />
          <line x1="422" x2="422" y1="380" y2="420" strokeOpacity="0.5" strokeDasharray="2 3" />
          <line x1="570" x2="570" y1="380" y2="420" strokeOpacity="0.5" strokeDasharray="2 3" />
        </g>
      </g>
      <g fill={RED} className="appear" style={{ animationDelay: "2.4s" }}>
        {[
          [422, 246],
          [570, 246],
          [570, 374],
          [422, 374],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" />
        ))}
      </g>
    </svg>
  );
}
