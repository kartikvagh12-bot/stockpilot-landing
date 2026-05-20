import Link from "next/link";

// Six operational failure patterns that almost every spreadsheet-driven
// factory shares. Phrasing is diagnostic — neither alarmist nor accusatory —
// so a reader recognises themselves without feeling sold to.
const BLIND_SPOTS = [
  {
    label: "Visibility",
    title: "Stock answers depend on who's around",
    body: "When the question is \"do we have it?\" and the answer is \"let me check with Ramesh,\" you don't have a system — you have a person.",
  },
  {
    label: "Coordination",
    title: "Reorders happen on WhatsApp threads",
    body: "Reorder points exist on paper. They get checked the moment a line stops, not the day before it would have.",
  },
  {
    label: "Recipes",
    title: "BOMs live inside someone's head",
    body: "Material consumption per product is informal. The cost of a unit shifts every week — and nobody can say by how much.",
  },
  {
    label: "Alerts",
    title: "Low stock surfaces too late",
    body: "Without automatic thresholds, the first signal of a shortage is an empty bin on the floor — not a notification.",
  },
  {
    label: "Continuity",
    title: "One absence stalls the floor",
    body: "If the inventory manager is on leave, production slows. Operational knowledge isn't shared — it's stored in one head.",
  },
  {
    label: "Scale",
    title: "What works at 50 SKUs breaks at 150",
    body: "Manual coordination scales linearly with order volume. Margin doesn't. Somewhere in between, the spreadsheet gives up.",
  },
];

export default function BlindSpots() {
  return (
    <section
      id="blind-spots"
      className="relative isolate overflow-hidden bg-black text-white"
    >
      {/* Industrial grid texture, fading top/bottom so the dark band reads as
          a discrete cinematic interlude inside the light page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-20%] -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl"
      />

      <div className="container-page py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Operational blind spots
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Most factories don&apos;t realise{" "}
            <span className="text-white/55">where they&apos;re losing money.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/65">
            Operational inefficiencies don&apos;t announce themselves. They
            compound silently — until a missed delivery, a stockout, or a
            month-end count makes them impossible to ignore.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BLIND_SPOTS.map((s) => (
            <article
              key={s.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-white/20 hover:bg-white/[0.045]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {s.label}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/health-check"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
          >
            Check your operational risk
            <ArrowRight />
          </Link>
          <span className="text-xs text-white/40">
            60 seconds · No signup required
          </span>
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
