"use client";

import { useState } from "react";
import { getSupabaseClient, type DemoRequestPayload } from "@/lib/supabase";
import { SITE } from "@/lib/site";

// Same Supabase path as before: an anon insert into `demo_requests`. The table
// has exactly name, email, phone, company, message, created_at, and adding a
// column is database work this change deliberately does not do. So the new
// qualification answer is written as the first line of `message`:
//
//   Needs: Both
//
//   <whatever the visitor typed>
//
// which is greppable, survives untouched, and needs no migration. A dedicated
// column is tracked separately.

const NEEDS = [
  "Running the factory",
  "Running the books",
  "Both",
  "Not sure yet",
] as const;

type Need = (typeof NEEDS)[number];

/** Prefix the qualification onto the free-text message without losing either. */
function composeMessage(need: Need | null, message: string): string | undefined {
  const parts: string[] = [];
  if (need) parts.push(`Needs: ${need}`);
  if (message) parts.push(message);
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [need, setNeed] = useState<Need | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: silently drop bots that fill the hidden field
    if ((data.get("website") || "").toString().trim() !== "") {
      setSubmitted(true);
      return;
    }

    const payload: DemoRequestPayload = {
      name: (data.get("name") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      phone: (data.get("phone") || "").toString().trim() || undefined,
      company: (data.get("company") || "").toString().trim() || undefined,
      message: composeMessage(
        need,
        (data.get("message") || "").toString().trim(),
      ),
    };

    if (!payload.name || !payload.email) {
      setError("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: insertErr } = await supabase
        .from("demo_requests")
        .insert([payload]);
      if (insertErr) throw insertErr;
      setSubmitted(true);
      form.reset();
      setNeed(null);
    } catch (err) {
      console.error("demo_requests insert failed", err);
      setError(
        `Couldn't send your request. Please try again, or email ${SITE.email} directly.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="section-deep scroll-mt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.1]"
      />

      <div className="container-page py-24 sm:py-28 lg:py-32">
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="eyebrow-invert">Talk to us</span>
            <h2 className="mt-6 h-deep">Book a demo.</h2>
            <p className="p-deep">
              Tell us what you make and where the process currently breaks, and
              we will tailor the demo around the parts of Operza that matter to
              you.
            </p>

            {/* Existing customers land here too, so the way back into the
                product sits beside the sales copy rather than only in the
                navbar. */}
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5">
              <p className="text-sm text-white/60">Already using Operza?</p>
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Open App
              </a>
            </div>

            <dl className="mt-10 space-y-6 text-sm">
              <ContactRow label="Email" value={SITE.email} href={`mailto:${SITE.email}`} />
              <ContactRow
                label="WhatsApp"
                value={SITE.whatsapp}
                href={SITE.whatsappLink}
              />
              <ContactRow label="Based in" value="India" />
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 sm:p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    Thanks, we will be in touch.
                  </h3>
                  <p className="mt-2 text-sm text-white/60">
                    We received your request and will reach out within one
                    working day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Your name" id="name" autoComplete="name" required />
                    <Field
                      label="Business name"
                      id="company"
                      autoComplete="organization"
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Email"
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                    />
                    <Field
                      label="Phone / WhatsApp"
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                    />
                  </div>

                  <fieldset>
                    <legend className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                      What do you need?
                    </legend>
                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                      {NEEDS.map((option) => {
                        const active = need === option;
                        return (
                          <label
                            key={option}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-white/60 ${
                              active
                                ? "border-brand-400 bg-brand-500/15 text-white"
                                : "border-white/12 bg-white/[0.02] text-white/80 hover:border-white/25"
                            }`}
                          >
                            <input
                              type="radio"
                              name="needs"
                              value={option}
                              checked={active}
                              onChange={() => setNeed(option)}
                              className="sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                                active
                                  ? "border-brand-400 bg-brand-500"
                                  : "border-white/30"
                              }`}
                            >
                              {active && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </span>
                            {option}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold uppercase tracking-wider text-white/60"
                    >
                      What do you make?
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      placeholder="e.g. wooden furniture, around 30 products, 12 staff"
                      className="mt-2 block w-full rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  {/* Honeypot: visually hidden, ignored by humans, filled by bots */}
                  <div
                    aria-hidden="true"
                    className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
                  >
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-invert w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Book a demo"}
                  </button>
                  <p className="text-center text-xs text-white/45">
                    We&apos;ll use these details to contact you about Operza.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-white/45">
        {label}
      </dt>
      <dd className="mt-1">
        {href ? (
          <a
            href={href}
            {...(href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="font-medium text-white">{value}</span>
        )}
      </dd>
    </div>
  );
}

function Field({
  label,
  id,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-white/60"
      >
        {label}
        {required && <span className="ml-0.5 text-red-300">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-2 block w-full rounded-lg border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
    </div>
  );
}
