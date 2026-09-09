import { SITE } from "@/lib/site";

// Typographic hero on the deep ground. No screenshot and no fake app window:
// the interactive examples start immediately below, so the hero's job is to
// say plainly what Operza covers.
//
// The strip under the copy is a diagram, not a product image. It names the
// four things the headline lists, in the order they happen.

const FLOW = ["Materials", "Production", "Dispatch", "Books"];

export default function Hero() {
  return (
    <section className="section-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.13]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-24%] -z-10 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/10 blur-3xl"
      />

      <div className="container-wide pt-20 pb-20 sm:pt-28 lg:pt-32 lg:pb-28">
        <div className="max-w-5xl animate-fade-up">
          <span className="eyebrow-invert">
            Manufacturing software for Indian factories
          </span>
          <h1 className="mt-7 h-display">
            Materials, production, dispatch and books.{" "}
            <span className="text-white/50">One system.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Operza records what comes into the factory, what gets made, packed
            and dispatched, and the invoices, bills and payments around it. With
            Operza Complete, the shop floor and the books stay connected.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#contact" className="btn-invert">
              Book a demo
              <ArrowRight />
            </a>
            <a
              href={SITE.app}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-invert-ghost"
            >
              Open App
            </a>
            <a
              href="#product"
              className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-3.5 text-sm font-semibold text-white/60 underline-offset-4 transition hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Explore Operza
            </a>
          </div>

          <p className="mt-6 text-sm text-white/45">
            Use it from a laptop or phone, without running the factory from
            spreadsheets.
          </p>
        </div>

        {/* The headline's four nouns, in the order they happen. */}
        <ul className="mt-16 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-white/[0.08] pt-8 sm:gap-x-5 lg:mt-20">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-3 sm:gap-5">
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-brand-500"
                />
                <span className="text-sm font-medium text-white/75 sm:text-base">
                  {step}
                </span>
              </span>
              {i < FLOW.length - 1 && (
                <span
                  aria-hidden="true"
                  className="h-px w-6 bg-white/15 sm:w-10"
                />
              )}
            </li>
          ))}
        </ul>
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
