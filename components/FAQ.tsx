"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Who is Operza built for?",
    a: "Small manufacturers in India — typically 5 to 50 staff — who currently track inventory and production on Excel, paper or WhatsApp. Furniture, garments, packaging, food processing, light fabrication, FMCG private label.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Operza runs in the browser. Open it on a laptop in the office or on a phone on the shop floor — same login, same data.",
  },
  {
    q: "Will it work on a slow internet connection?",
    a: "Yes. The app is lightweight and works on a 3G connection. Data syncs in the background; the UI stays responsive.",
  },
  {
    q: "Can I import my existing parts and products?",
    a: "Yes. You can paste from Excel or import a CSV during onboarding. We also seed sample data for furniture, garment, packaging or food manufacturers so you can see the workflow before adding your own.",
  },
  {
    q: "Is my data safe?",
    a: "Each business gets its own isolated workspace, protected at the database level. Only users you invite can see your data. Backups run automatically.",
  },
  {
    q: "How much does it cost?",
    a: "We're onboarding early customers manually right now. Book a demo and we'll share pricing tailored to your factory size.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">FAQ</span>
          <h2 className="h-section">Questions we hear all the time.</h2>
          <p className="p-section">
            Don&apos;t see your question? Reach out via the contact form — we
            usually reply within a working day.
          </p>
        </div>

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-900 sm:text-base">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border border-slate-200 text-slate-500 transition ${
                      isOpen ? "rotate-45 border-brand-200 text-brand-600" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-7 text-slate-600 sm:px-6">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
