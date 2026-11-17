import Link from "next/link";
import PlanDrawing from "@/components/art/PlanDrawing";
import { LINSPACE, STATUS_LABEL } from "@/lib/site";

// Operza Linspace on the company homepage: a product in development.
//
// It names the direction the Founder approved (construction drawings,
// quantity takeoff, bills of quantities, cost estimation) as what the product
// is being designed around, never as something it does today. It states the
// status plainly and promises nothing: no date, no pricing, no sign-up.

export default function LinspacePreview() {
  return (
    <section id="linspace" className="section-deep scroll-mt-16">
      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <PlanDrawing className="h-auto w-full" />
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="label-invert">{LINSPACE.name}</p>
              <span className="status-pill border-white/20 text-white/75">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {STATUS_LABEL[LINSPACE.status]}
              </span>
            </div>
            <h2 className="mt-6 h-deep">For construction, in development.</h2>
            <p className="p-deep">
              Operza Linspace is the product we are developing for
              construction. It is being designed around construction drawings,
              quantity takeoff, bills of quantities and cost estimation.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/50">
              It is not available yet, and we have not announced a release
              date.
            </p>
            <Link
              href={LINSPACE.path}
              className="link-arrow mt-9 text-white focus-visible:ring-white/70 focus-visible:ring-offset-[#05070f]"
            >
              About {LINSPACE.name}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
