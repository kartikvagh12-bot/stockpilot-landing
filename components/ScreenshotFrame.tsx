import Image from "next/image";

/**
 * The frame every product visual on the marketing site sits in.
 *
 * `src` is REQUIRED. There is no placeholder state and no fallback drawing:
 * either a real capture exists or the section does without a visual. The
 * previous site carried four separate systems of hand-drawn fake UI, complete
 * with browser traffic lights, and by the time Operza had grown a full
 * accounting module those mockups were stale and misleading. Making the type
 * demand a real file is what stops that returning.
 *
 * Every capture comes from a seeded sample workspace. Money-bearing screens
 * carry a visible "Sample workspace" chip through `sample`, because a
 * statement image reads as a real business's numbers unless something says
 * otherwise.
 */

export type Shot = {
  /** Path under /public. Required: there is no pending state. */
  src: string;
  alt: string;
  /** Which screen this is, used for the caption and internal reference. */
  screen: string;
  width: number;
  height: number;
  /** Marks money-bearing captures as sample data. */
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
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          priority={priority}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="block h-auto w-full"
        />

        {/* The chip sits ON the capture, and every capture is light UI, so it
            is solid dark in both tones. A translucent white pill vanished into
            the screenshot behind it, which defeats the point of labelling. */}
        {shot.sample && (
          <span className="absolute right-3 top-3 rounded-md bg-slate-900/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white shadow-sm ring-1 ring-inset ring-white/15">
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
