import ScreenshotFrame, { type Shot } from "@/components/ScreenshotFrame";

// Deep hero. The previous one was left text plus a hand-built fake dashboard,
// which is the default SaaS template and also no longer resembled the app.
// Here the copy sits above and the product runs wide underneath it, so the
// software is the graphic rather than an illustration beside the pitch.

const DASHBOARD: Shot = {
  src: "/product/dashboard-low-stock-and-capacity.png",
  screen: "Dashboard",
  alt: "The Operza dashboard showing materials at or below their alert level, and a production capacity table listing how many units of each product can be made and which material is limiting each one",
  width: 1316,
  height: 916,
};

// The money half of the hero claim, from a recorded dispatch. Small, wide, and
// it carries revenue, manufacturing cost and gross margin in one strip.
const MARGIN: Shot = {
  src: "/product/dispatch-order-totals.png",
  screen: "Dispatch order totals",
  alt: "Order totals from a recorded dispatch in Operza: revenue, manufacturing cost, and gross margin with its percentage",
  width: 618,
  height: 126,
  sample: true,
};

export default function Hero() {
  return (
    <section className="section-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.13]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-28%] -z-10 h-[540px] w-[1000px] -translate-x-1/2 rounded-full bg-brand-600/12 blur-3xl"
      />

      <div className="container-wide pt-20 pb-16 sm:pt-28 lg:pt-32 lg:pb-24">
        <div className="max-w-4xl animate-fade-up">
          <span className="eyebrow-invert">For manufacturers in India</span>
          <h1 className="mt-7 h-display">
            Run the factory and the books{" "}
            <span className="text-white/50">in one system.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
            Operza records what happens on the shop floor and the money that
            moves with it. In Operza Complete the two are connected, so a
            dispatch drops finished-goods stock and records the sale in your
            books in the same step.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className="btn-invert">
              Book a demo
              <ArrowRight />
            </a>
            <a href="#plans" className="btn-invert-ghost">
              See what Operza does
            </a>
          </div>

          <p className="mt-6 text-sm text-white/45">
            Operza runs in your browser, on a laptop or a phone.
          </p>
        </div>

        {/* Product plate. The margin crop overlaps the dashboard on large
            screens and stacks underneath it on small ones, so the "both sides"
            claim in the paragraph above has something to point at. */}
        <div className="relative mt-16 lg:mt-20">
          <ScreenshotFrame
            shot={DASHBOARD}
            tone="deep"
            priority
            className="lg:mr-[16%]"
          />
          <ScreenshotFrame
            shot={MARGIN}
            tone="deep"
            className="mt-4 lg:absolute lg:-bottom-10 lg:right-0 lg:mt-0 lg:w-[38%]"
          />
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
