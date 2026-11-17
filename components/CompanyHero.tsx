import Link from "next/link";
import AskOperza from "@/components/AskOperza";
import TangleToOrder from "@/components/art/TangleToOrder";
import { DEMO_HREF, PRODUCTS, STATUS_LABEL } from "@/lib/site";

// The company homepage hero. Founder-approved direction (2026-11):
// eyebrow "Software for complex work", headline "Complex work. Clearer
// possibilities.", and the supporting line naming the two industries without
// any claim beyond them. The page's only h1.
//
// The drawing beside it is the concept stated visually: tangled workflows
// passing through a frame and leaving as ordered lanes. Below the copy, an
// index of the products, so discovery starts in the first screen.
//
// The "Ask anything about Operza..." input sits under the actions, but only
// when the server has confirmed the assistant is fully configured (the
// `assistant` prop, from lib/assistant/runtime/config.ts). Otherwise nothing
// is rendered there: never a disabled or pretend box.

export default function CompanyHero({ assistant = false }: { assistant?: boolean }) {
  return (
    <section className="section-deep">
      {/* Drafting columns: hairline verticals at the page's column rhythm. */}
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

      <div className="container-wide pt-16 pb-14 sm:pt-24 lg:pt-28 lg:pb-16">
        {/* With the assistant present the copy column can grow as a
            conversation runs, so the drawing holds its place at the top
            instead of drifting down with the column's centre. */}
        <div
          className={`grid gap-y-10 lg:grid-cols-12 lg:gap-x-10 ${
            assistant ? "items-center lg:items-start" : "items-center"
          }`}
        >
          <div className="lg:col-span-7">
            <p className="label-invert">Software for complex work</p>
            <h1 className="mt-7 h-editorial text-balance">
              <span className="block text-white/45">Complex work.</span>{" "}
              <span className="block text-white">Clearer possibilities.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Operza builds software for complex business workflows. Our first
              product serves manufacturing, and we&apos;re developing our next
              for construction.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#products" className="btn-invert">
                Explore our products
                <ArrowRight />
              </a>
              <Link href={DEMO_HREF} className="btn-invert-ghost">
                Book a demo
              </Link>
            </div>
            {assistant && <AskOperza />}
          </div>

          <div className={`lg:col-span-5 ${assistant ? "lg:mt-16" : ""}`}>
            <TangleToOrder className="mx-auto h-auto w-full max-w-[34rem] lg:max-w-none" />
          </div>
        </div>

        {/* Product index: the two products, as a ruled list. */}
        <ul className="mt-14 grid border-t border-white/10 sm:grid-cols-2 lg:mt-16">
          {PRODUCTS.map((p, i) => (
            <li
              key={p.id}
              className={`border-b border-white/10 sm:border-b-0 ${i > 0 ? "sm:border-l sm:pl-8" : "sm:pr-8"}`}
            >
              <Link
                href={p.path}
                className="group flex items-start justify-between gap-6 rounded-sm py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <span className="flex gap-5">
                  <span className="pt-1 text-xs font-semibold tabular-nums tracking-[0.14em] text-white/35">
                    0{i + 1}
                  </span>
                  <span>
                    <span className="block text-lg font-semibold tracking-tight text-white sm:text-xl">
                      {p.name}
                    </span>
                    <span className="mt-1 block text-sm text-white/55">
                      {p.industry}
                      <span aria-hidden="true" className="mx-2 text-white/25">/</span>
                      <span className={p.status === "in-development" ? "text-brand-400" : "text-white/70"}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white"
                >
                  <ArrowRight />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
