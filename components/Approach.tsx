// "Our approach": the short company philosophy. Founder-provided copy
// (provisional), and nothing beyond it: no history, team size, customer
// counts or achievements.
//
// The figure is a module grid with one cell resolved in red: structure first,
// then the one thing that matters made clear. Decorative.

export default function Approach() {
  return (
    <section id="company" className="bg-pearl scroll-mt-16">
      <div className="container-wide py-24 sm:py-28 lg:py-36">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-8">
            <p className="label">Our approach</p>
            <h2 className="mt-6 h-editorial text-slate-900">
              Software shaped around real work.
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
              We believe good software should help people manage complex work
              with greater clarity.
            </p>
          </div>
          <div className="lg:col-span-4">
            <ModuleGrid />
          </div>
        </div>
      </div>
    </section>
  );
}

function ModuleGrid() {
  const cells = Array.from({ length: 16 }, (_, i) => i);
  const red = 6;
  return (
    <div aria-hidden="true" className="mx-auto grid aspect-square w-full max-w-[18rem] grid-cols-4 border-l border-t border-slate-300 lg:ml-auto lg:mr-0">
      {cells.map((i) => (
        <span
          key={i}
          className={`flex items-center justify-center border-b border-r border-slate-300 ${
            i === 5 || i === 9 || i === 10 || i === red ? "bg-white" : ""
          }`}
        >
          {i === red && <span className="h-1/3 w-1/3 bg-brand-500" />}
        </span>
      ))}
    </div>
  );
}
