"use client";

import { useRef, useState } from "react";
import FactoryDemo from "@/components/demos/FactoryDemo";
import BooksDemo from "@/components/demos/BooksDemo";
import CompleteDemo from "@/components/demos/CompleteDemo";

// The homepage's main product story. It does not show the app; it lets the
// visitor move a few controls and watch a business result change.
//
// Three modes, matching the three ways Operza is set up. Each panel keeps its
// own local state and resets on its own; switching tabs does not wipe the one
// you were on, so you can compare.

const MODES = [
  {
    id: "factory",
    label: "Factory",
    blurb: "Material in, units made, units out.",
    render: () => <FactoryDemo />,
  },
  {
    id: "books",
    label: "Books",
    blurb: "A bill, a payment, and what is still owed.",
    render: () => <BooksDemo />,
  },
  {
    id: "complete",
    label: "Complete",
    blurb: "One dispatch that moves the floor and the books.",
    render: () => <CompleteDemo />,
  },
] as const;

export default function ProductExperience() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs, which is what a tablist is expected to do.
  function onKeyDown(e: React.KeyboardEvent) {
    const last = MODES.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="product" className="section-deep scroll-mt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.11]"
      />

      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <span className="eyebrow-invert">Try it here</span>
          <h2 className="mt-6 h-deep">
            See what changes when the work is recorded.
          </h2>
          <p className="p-deep">
            A few simplified examples of how Operza connects the work happening
            in the factory with the record behind it.
          </p>
        </div>

        <div className="mt-12 max-w-4xl">
          <div
            role="tablist"
            aria-label="Choose an Operza example"
            onKeyDown={onKeyDown}
            className="inline-flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1.5"
          >
            {MODES.map((m, i) => {
              const selected = i === active;
              return (
                <button
                  key={m.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`mode-tab-${m.id}`}
                  aria-selected={selected}
                  aria-controls={`mode-panel-${m.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f] ${
                    selected
                      ? "bg-brand-500 text-white"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-white/55">{MODES[active].blurb}</p>

          <div className="mt-6">
            {MODES.map((m, i) => (
              <div
                key={m.id}
                role="tabpanel"
                id={`mode-panel-${m.id}`}
                aria-labelledby={`mode-tab-${m.id}`}
                hidden={i !== active}
              >
                {/* Every panel stays mounted so its local state survives a tab
                    switch: run the Factory example, look at Books, come back,
                    and the numbers are where you left them. `hidden` keeps the
                    inactive ones out of the page for keyboard and assistive
                    tech alike. */}
                {m.render()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
