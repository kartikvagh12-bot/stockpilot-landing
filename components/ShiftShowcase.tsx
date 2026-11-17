import Link from "next/link";
import ShiftFlow from "@/components/art/ShiftFlow";
import { PLANS } from "@/components/Plans";
import { SHIFT, SITE, STATUS_LABEL } from "@/lib/site";

// Operza Shift on the company homepage: the product that exists today.
//
// Every claim is one the Operza Shift page already makes, checked against
// operza-app. The plan names and taglines are read from Plans.tsx (which takes
// them from the app's onboarding screen), so the homepage cannot rename or
// re-describe a plan. The website-level name sits above them; the plans keep
// their own names.

export default function ShiftShowcase() {
  return (
    <section id="shift" className="scroll-mt-16 border-t border-slate-200 bg-white">
      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="label">{SHIFT.name}</p>
              <span className="status-pill border-slate-300 text-slate-600">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                {STATUS_LABEL[SHIFT.status]}
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-4xl lg:text-[2.9rem] lg:leading-[1.08]">
              Software for manufacturers, from the shop floor to the books.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Operza Shift records materials, production, packing and dispatch
              on the floor, and the invoices, bills, payments and statements in
              the books. Choose the plan that matches how your business runs.
            </p>

            <dl className="mt-10 border-t border-slate-200">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="grid gap-1 border-b border-slate-200 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6"
                >
                  <dt className="text-sm font-semibold text-slate-900">{plan.name}</dt>
                  <dd className="text-sm leading-6 text-slate-600">{plan.tagline}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              The plans carry these same names inside the app.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={SHIFT.path} className="btn-primary">
                Explore {SHIFT.name}
                <ArrowRight />
              </Link>
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Open App
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            <div className="relative border border-slate-200 bg-pearl p-6 sm:p-10 lg:p-12">
              <CropMarks />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                How the plans fit together
              </p>
              <div className="mt-8">
                <ShiftFlow />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Corner marks, as on a drawing sheet: the panel is a figure, not a card. */
function CropMarks() {
  const mark = "absolute h-3 w-3 border-slate-900";
  return (
    <span aria-hidden="true">
      <span className={`${mark} -left-px -top-px border-l-2 border-t-2`} />
      <span className={`${mark} -right-px -top-px border-r-2 border-t-2`} />
      <span className={`${mark} -bottom-px -left-px border-b-2 border-l-2`} />
      <span className={`${mark} -bottom-px -right-px border-b-2 border-r-2`} />
    </span>
  );
}

function ArrowRight() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
