import Link from "next/link";
import { DEMO_HREF, SHIFT, SITE } from "@/lib/site";

// The company homepage's contact section. It does not host a form: the one
// working demo-request form lives on the Operza Shift page, which is the
// product a demo can show today, so this sends demo requests there. Everything
// else goes to the company's existing email and WhatsApp. Existing customers
// get Open App here as well as in the navbar.

export default function CompanyContact() {
  return (
    <section id="contact" className="section-deep scroll-mt-16">
      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <p className="label-invert">Contact</p>
            <h2 className="mt-6 h-deep">Talk to Operza.</h2>
            <p className="p-deep">
              For a demo of {SHIFT.name}, tell us about your business and we
              will set up a time. For anything else, write to us or send a
              message on WhatsApp.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={DEMO_HREF} className="btn-invert">
                Book a demo
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-invert-ghost"
              >
                Open App
              </a>
            </div>
          </div>

          <dl className="border-t border-white/10 lg:col-span-5 lg:col-start-8">
            <Row label="Email" value={SITE.email} href={`mailto:${SITE.email}`} />
            <Row label="WhatsApp" value={SITE.whatsapp} href={SITE.whatsappLink} />
            <Row label="Based in" value="India" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-b border-white/10 py-5">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{label}</dt>
      <dd className="text-base text-white">
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-sm underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
