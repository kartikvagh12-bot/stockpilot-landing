import Link from "next/link";
import { SITE } from "@/lib/site";

const COLS: Array<{ heading: string; links: Array<{ href: string; label: string; external?: boolean }> }> = [
  {
    heading: "Product",
    links: [
      { href: "/#workflow", label: "Workflow" },
      { href: "/#features", label: "Features" },
      { href: "/#screenshots", label: "Screenshots" },
      { href: SITE.app, label: "Open app", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/health-check", label: "Health check" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#contact", label: "Contact" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { href: `mailto:${SITE.email}`, label: SITE.email, external: true },
      { href: SITE.whatsappLink, label: `WhatsApp ${SITE.whatsapp}`, external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M3 7l9-4 9 4-9 4-9-4z" />
                  <path d="M3 12l9 4 9-4" />
                  <path d="M3 17l9 4 9-4" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-slate-900">Operza</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Inventory and production tracking for manufacturers. Built and
              hosted in India.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.heading} className="lg:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {col.heading}
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
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

        <div className="mt-12 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Operza. Built for manufacturers in India.</p>
          <p>Hosted on Vercel · Backed by Supabase</p>
        </div>
      </div>
    </footer>
  );
}
