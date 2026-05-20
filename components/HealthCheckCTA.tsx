import Link from "next/link";

// Narrow dark band immediately after BlindSpots. Acts as the funnel
// hand-off: the visitor has just been shown the patterns, this is where
// they're invited to find out which apply to them — before the light
// product sections open up below.

export default function HealthCheckCTA() {
  return (
    <section
      aria-label="Manufacturing Health Check"
      className="relative isolate overflow-hidden bg-black text-white"
    >
      {/* A thin top divider to soften the seam with the BlindSpots section
          above, since both are dark and share a background. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/2 -z-10 h-[360px] w-[360px] -translate-y-1/2 rounded-full bg-red-500/10 blur-3xl"
      />

      <div className="container-page py-20 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              60-second assessment
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Would your factory pass an{" "}
              <span className="text-white/55">operational audit?</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/65">
              Eight quick questions. No email, no signup. You&apos;ll get an
              operational snapshot showing exactly which blind spots apply to
              your floor — and which patterns to fix first.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <Link
              href="/health-check"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Take the health check
              <ArrowRight />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08]"
            >
              Book a demo
            </a>
          </div>
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
