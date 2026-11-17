import Link from "next/link";
import { LINSPACE, SHIFT, SITE, STATUS_LABEL } from "@/lib/site";

// Where Operza Linspace stands, in plain words. No release date, no pricing,
// no waiting list and no sign-up: the Founder chose the conservative option
// for this release candidate. A visitor who wants to talk about construction
// work reaches the company's ordinary contact details.

export default function LinspaceStatus() {
  return (
    <section id="status" className="scroll-mt-16 border-t border-slate-200 bg-white">
      <div className="container-wide py-24 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="label">Where it stands</p>
            <p className="mt-6 inline-flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-500" />
              {STATUS_LABEL[LINSPACE.status]}
            </p>
          </div>
          <div className="space-y-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:col-span-7">
            <p>
              {LINSPACE.name} is in development. It is not available to use
              yet, and we have not announced a release date.
            </p>
            <p>
              If your work involves construction drawings, quantities or
              estimates and you would like to talk to us about it, write to{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="font-semibold text-slate-900 underline underline-offset-4"
              >
                {SITE.email}
              </a>
              .
            </p>
            <p>
              {SHIFT.name}, our software for manufacturers, is available today.
            </p>
            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
              <Link href={SHIFT.path} className="btn-primary">
                Explore {SHIFT.name}
              </Link>
              <Link href="/" className="btn-secondary">
                Back to Operza
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
