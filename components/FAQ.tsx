"use client";

import { useId, useState } from "react";
import { FAQ_ITEMS } from "@/lib/faq";

// Reads lib/faq.ts, the same array the FAQPage structured data is built from.
// Accordion semantics: a real button per row, aria-expanded, aria-controls, and
// the panel kept in the DOM under `hidden` so the control always has something
// to point at.

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="section scroll-mt-16">
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <span className="eyebrow">FAQ</span>
          <h2 className="h-section">Questions we get asked.</h2>
          <p className="p-section">
            Anything else, put it in the form below and we will answer it on the
            call.
          </p>
        </div>

        <div className="lg:col-span-8">
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              const panelId = `${baseId}-panel-${i}`;
              const buttonId = `${baseId}-button-${i}`;
              return (
                <div key={item.question}>
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition hover:bg-slate-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 sm:px-6"
                    >
                      <span className="text-sm font-semibold text-slate-900 sm:text-base">
                        {item.question}
                      </span>
                      <span
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border transition ${
                          isOpen
                            ? "rotate-45 border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-500"
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          viewBox="0 0 12 12"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        >
                          <path d="M6 1v10M1 6h10" />
                        </svg>
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="px-5 pb-5 text-sm leading-7 text-slate-600 sm:px-6"
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
