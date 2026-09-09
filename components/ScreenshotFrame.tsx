import Image from "next/image";

/**
 * The frame every product visual on the marketing site sits in.
 *
 * Two states, and the distinction is deliberate:
 *
 *  - `src` present: a real capture, rendered through next/image.
 *  - `src` absent: an explicit, obviously unfinished placeholder naming the
 *    screen that still has to be captured.
 *
 * The placeholder does NOT imitate the product. The previous site drew four
 * separate systems of fake Tailwind UI, complete with browser traffic lights,
 * and by the time Operza had grown to a full accounting module those mockups
 * were both stale and misleading. A blank labelled panel is honest about the
 * fact that the capture is outstanding; a hand-drawn dashboard is not.
 *
 * Captures must come from a seeded sample workspace. Financial screens carry a
 * visible "Sample workspace" chip through `sample`, because a Balance Sheet
 * image reads as a real business's numbers unless something says otherwise.
 */

export type Shot = {
  /** Path under /public once the capture exists. Omit while pending. */
  src?: string;
  /** Alt text. Required either way: it also labels the pending placeholder. */
  alt: string;
  /** Which screen this is, shown on the placeholder. */
  screen: string;
  width?: number;
  height?: number;
  /** Marks financial or money-bearing captures as sample data. */
  sample?: boolean;
  /** Optional caption rendered under the frame. */
  caption?: string;
};

export default function ScreenshotFrame({
  shot,
  tone = "light",
  priority = false,
  className = "",
}: {
  shot: Shot;
  tone?: "light" | "deep";
  priority?: boolean;
  className?: string;
}) {
  const deep = tone === "deep";

  return (
    <figure className={className}>
      <div
        className={`relative overflow-hidden rounded-xl border ${
          deep
            ? "border-white/12 bg-white/[0.03] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]"
            : "border-slate-200 bg-slate-50 shadow-soft"
        }`}
      >
        {shot.src ? (
          <Image
            src={shot.src}
            alt={shot.alt}
            width={shot.width ?? 1600}
            height={shot.height ?? 1000}
            priority={priority}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="block h-auto w-full"
          />
        ) : (
          <PendingCapture screen={shot.screen} deep={deep} />
        )}

        {shot.sample && (
          <span
            className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
              deep
                ? "bg-white/10 text-white/75 ring-1 ring-inset ring-white/15"
                : "bg-slate-900/85 text-white"
            }`}
          >
            Sample workspace
          </span>
        )}
      </div>

      {shot.caption && (
        <figcaption
          className={`mt-3 text-xs ${deep ? "text-white/45" : "text-slate-500"}`}
        >
          {shot.caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Deliberately unmistakable. If this ever reaches production it should be
 * obvious within a second that the capture step was skipped, rather than
 * quietly passing for a product visual.
 */
function PendingCapture({ screen, deep }: { screen: string; deep: boolean }) {
  return (
    <div
      role="img"
      aria-label={`Placeholder: screenshot of ${screen} has not been captured yet`}
      className={`flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 px-6 text-center ${
        deep ? "text-white/40" : "text-slate-400"
      }`}
      style={{
        backgroundImage: deep
          ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px)"
          : "repeating-linear-gradient(135deg, rgba(15,23,42,0.05) 0 10px, transparent 10px 20px)",
      }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
        Screenshot pending
      </span>
      <span
        className={`text-sm font-medium ${deep ? "text-white/70" : "text-slate-600"}`}
      >
        {screen}
      </span>
      <span className="max-w-xs text-xs leading-5">
        Awaiting an approved capture from a seeded sample workspace.
      </span>
    </div>
  );
}
