// "What we build": the company's one idea, stated before the products.
// Founder-provided copy (provisional). A full-width editorial composition:
// the statement on the left, its explanation set against the baseline on the
// right, and a measured rule underneath rather than a row of cards.

export default function WhatWeBuild() {
  return (
    <section id="products" className="bg-pearl scroll-mt-16">
      <div className="container-wide pt-24 pb-16 sm:pt-28 lg:pt-36 lg:pb-20">
        <p className="label">What we build</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h2 className="h-statement text-slate-900 lg:col-span-7">
            Different industries.{" "}
            <span className="text-slate-400">One approach.</span>
          </h2>
          <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:col-span-5">
            We build software around the processes businesses depend on,
            bringing structure to information, workflows and everyday
            operations.
          </p>
        </div>
        <MeasureRule />
      </div>
    </section>
  );
}

/** A dimension line: a hairline with ticks at the page's column rhythm and a
 *  single red tick, the one accent in an otherwise quiet section. */
function MeasureRule() {
  return (
    <div aria-hidden="true" className="relative mt-16 h-4 lg:mt-20">
      <span className="absolute inset-x-0 top-1/2 h-px bg-slate-300" />
      <span className="absolute inset-0 grid grid-cols-6 lg:grid-cols-12">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className={`border-l border-slate-300 ${i >= 6 ? "hidden lg:block" : ""}`} />
        ))}
      </span>
      <span className="absolute right-0 top-0 h-full w-px bg-slate-300" />
      <span className="absolute left-[33.333%] top-[-4px] h-[calc(100%+8px)] w-[2px] bg-brand-500 lg:left-[58.333%]" />
    </div>
  );
}
