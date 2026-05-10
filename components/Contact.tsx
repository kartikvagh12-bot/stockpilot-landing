"use client";

import { useState } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="section bg-gradient-to-b from-brand-50/40 to-white">
      <div className="container-page">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Try it on your factory</span>
            <h2 className="h-section">Book a 20-minute demo.</h2>
            <p className="p-section">
              Tell us what you make. We&apos;ll set up StockPilot with your
              parts and products, walk you through the dashboard, and answer
              every question.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-700">
              <ContactRow
                label="Email"
                value="kartikvagh12@gmail.com"
                href="mailto:kartikvagh12@gmail.com"
              />
              <ContactRow
                label="WhatsApp"
                value="+91 87338 65541"
                href="https://wa.me/918733865541"
              />
              <ContactRow label="Based in" value="India · Built for India" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
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
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Thanks — we&apos;ll be in touch.
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  We received your request and will reach out within one
                  working day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" id="name" autoComplete="name" required />
                  <Field
                    label="Business name"
                    id="business"
                    autoComplete="organization"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    What do you make?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="e.g. wooden furniture, around 30 SKUs, 12 staff"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Request a demo
                </button>
                <p className="text-center text-xs text-slate-500">
                  We&apos;ll never share your details. No spam, ever.
                </p>
              </form>
            )}
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        {href ? (
          <a
            href={href}
            {...(href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="text-sm font-medium text-slate-900 hover:text-brand-600"
          >
            {value}
          </a>
        ) : (
          <div className="text-sm font-medium text-slate-900">{value}</div>
        )}
      </div>
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
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
      >
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
