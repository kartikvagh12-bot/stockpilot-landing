import Link from "next/link";
import { SITE } from "@/lib/site";

// Link groups follow the homepage that actually exists. The previous footer
// filed Health Check, FAQ and Contact under "Company", which none of them are,
// and closed with "Hosted on Vercel, backed by Supabase", which is vendor
// trivia rather than a reason for a factory owner to trust the product.

const COLS: Array<{
  heading: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}> = [
  {
    heading: "Product",
    links: [
      { href: "/#factory", label: "Factory" },
      { href: "/#books", label: "Books" },
      { href: "/#costing", label: "Costing" },
      { href: "/#plans", label: "Factory, Books, Complete" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { href: "/health-check", label: "Health Check" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#contact", label: "Book a demo" },
      { href: SITE.app, label: "Sign in", external: true },
    ],
  },
  {
    heading: "Contact",
    links: [
      { href: `mailto:${SITE.email}`, label: SITE.email, external: true },
      {
        href: SITE.whatsappLink,
        label: `WhatsApp ${SITE.whatsapp}`,
        external: true,
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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
              <span className="text-sm font-semibold text-slate-900">Operza</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Manufacturing software for Indian factories: materials, production
              and dispatch on the floor, and the invoices, bills and books that
              go with them.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.heading} className="lg:col-span-2 lg:col-start-auto">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          l.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-slate-600 transition hover:text-slate-900"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-slate-600 transition hover:text-slate-900"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Operza. Built for manufacturers in
            India.
          </p>
        </div>
      </div>
    </footer>
  );
}
