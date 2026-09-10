import Link from "next/link";

// The Health Check earns a real section rather than a footer link. It is the
// one part of the site a visitor can use before talking to anyone.

export default function HealthCheckCallout() {
  return (
    <section className="section border-t border-slate-200/70">
      <div className="container-page">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <span className="eyebrow">Factory Health Check</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                How visible is your factory operation?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Eight questions about materials, production and finished goods.
                Get an instant operational snapshot and see where the record
                still depends on manual checks or one person.
              </p>
              <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <li className="inline-flex items-center gap-2">
                  <Dot /> No email required
                </li>
                <li className="inline-flex items-center gap-2">
                  <Dot /> Instant result
                </li>
                <li className="inline-flex items-center gap-2">
                  <Dot /> About a minute
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5 lg:justify-self-end">
              <Link href="/health-check" className="btn-primary w-full sm:w-auto">
                Take the Health Check
                <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return (
    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
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
