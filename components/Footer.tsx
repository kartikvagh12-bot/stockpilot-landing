import Link from "next/link";
import { DEMO_HREF, PRODUCTS, SITE, STATUS_LABEL } from "@/lib/site";

// The company footer, used on every page that uses the Navbar. Operza is the
// visible brand. Products come from the registry; the registered company name
// appears once, in the legal line at the bottom, read from SITE.legalName.
// No legal pages are linked because none exist yet.

type FooterLink = { href: string; label: string; external?: boolean; note?: string };

const COLS: Array<{ heading: string; links: FooterLink[] }> = [
  {
    heading: "Products",
    links: PRODUCTS.map((p) => ({
      href: p.path,
      label: p.name,
      note: p.status === "in-development" ? STATUS_LABEL[p.status] : undefined,
    })),
  },
  {
    heading: "Company",
    links: [
      { href: "/#company", label: "Our approach" },
      { href: "/#contact", label: "Contact" },
      { href: "/health-check", label: "Factory Health Check" },
    ],
  },
  {
    heading: "Get in touch",
    links: [
      { href: DEMO_HREF, label: "Book a demo" },
      { href: SITE.app, label: "Open App", external: true },
      { href: `mailto:${SITE.email}`, label: SITE.email, external: true },
      {
        href: SITE.whatsappLink,
        label: `WhatsApp ${SITE.whatsapp}`,
        external: true,
      },
    ],
  },
];

const linkClass =
  "rounded-sm text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-wide py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              {/* Same mark file as the Navbar. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/operza-logo.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
                aria-hidden="true"
              />
              <span className="text-base font-semibold tracking-tight text-slate-900">
                Operza
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">
              Operza builds software for complex business workflows: Operza
              Shift for manufacturing, and Operza Linspace, in development for
              construction.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.heading} className="lg:col-span-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={linkClass}
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    )}
                    {l.note && (
                      <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600">
                        {l.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <p>Operza is based in India.</p>
        </div>
      </div>
    </footer>
  );
}
