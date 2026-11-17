import Link from "next/link";
import PlanDrawing from "@/components/art/PlanDrawing";
import { LINSPACE, STATUS_LABEL } from "@/lib/site";

// The Operza Linspace page hero. The heading is the Founder's suggested line.
// The status is stated twice in the first screen, as a badge and in words,
// so nobody reads the page as a product they can use today.

export default function LinspaceHero() {
  return (
    <section className="section-deep">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="container-wide grid h-full grid-cols-4 lg:grid-cols-12">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className={`border-l border-white/[0.04] ${i >= 4 ? "hidden lg:block" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="container-wide pt-16 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
        <div className="grid items-center gap-y-14 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="label-invert">{LINSPACE.name}</p>
              <span className="status-pill border-white/20 text-white/80">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {STATUS_LABEL[LINSPACE.status]}
              </span>
            </div>
            <h1 className="mt-7 text-[2.4rem] font-semibold leading-[1.04] tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.9rem]">
              A clearer way to work with construction information.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Operza Linspace is the product Operza is developing for
              construction. It is being designed around construction drawings,
              quantity takeoff, bills of quantities and cost estimation.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/50">
              It is in development and not available yet.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/#contact" className="btn-invert">
                Contact Operza
              </Link>
              <a href="#status" className="btn-invert-ghost">
                Where it stands
              </a>
            </div>
          </div>
          <div className="lg:col-span-6">
            <PlanDrawing className="h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
