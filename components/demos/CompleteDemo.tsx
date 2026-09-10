"use client";

import { useEffect, useRef, useState } from "react";
import {
  ActivityFeed,
  DemoButton,
  DemoPanel,
  ResetButton,
  StatRow,
  inr,
  prefersReducedMotion,
  useActivity,
  useAnimatedNumber,
} from "./demo-ui";

// The one that only Complete can do: a dispatch reduces finished-goods stock
// AND records the sale, so what the customer owes moves at the same time.
//
// The three steps are revealed in sequence because the order is the point.
// Reduced motion gets all three at once.
//
// Boundaries held: a Factory-only workspace does NOT create the accounting
// entry, and nothing here suggests Tally sync.

const START = { finished: 18, receivable: 0, invoiced: false };
const DISPATCH_QTY = 4;
const PRICE_PER_UNIT = 12000;
const SALE = DISPATCH_QTY * PRICE_PER_UNIT;

export default function CompleteDemo() {
  const [s, setS] = useState(START);
  const [step, setStep] = useState(0); // 0 idle, 1 dispatched, 2 invoiced, 3 receivable
  const { items, push, clear } = useActivity();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const finished = useAnimatedNumber(s.finished);
  const receivable = useAnimatedNumber(s.receivable);

  // The reveal takes about 1.3s and `invoiced` only turns true at the end of
  // it. Guarding on that left a window where a second click deducted another
  // four units and restarted the timers, so one example produced two
  // dispatches. `step` covers the whole lifecycle: anything other than idle
  // means a dispatch is already in flight or finished.
  const inFlight = step !== 0;

  // `inFlight` is what the button renders from, but it cannot be what
  // `dispatch` tests: a click handler never sees a state update queued by an
  // earlier click in the same task, so a fast burst reads step === 0 every
  // time and deducts once per click. This ref is written synchronously, so
  // the second click sees the first one immediately. It is not a second
  // source of truth: reset clears both, and they always agree by the next
  // render.
  const started = useRef(false);

  function dispatch() {
    if (started.current) return;
    started.current = true;

    setS((p) => ({ ...p, finished: p.finished - DISPATCH_QTY }));
    setStep(1);
    push(`Dispatch recorded. ${DISPATCH_QTY} units left the factory.`, "good");

    const instant = prefersReducedMotion();
    const at = (ms: number, fn: () => void) => {
      if (instant) fn();
      else timers.current.push(setTimeout(fn, ms));
    };

    at(650, () => {
      setStep(2);
      push("Sales invoice created in the books", "accent");
    });
    at(1300, () => {
      setStep(3);
      setS((p) => ({ ...p, receivable: SALE, invoiced: true }));
      push(`Customer now owes ${inr(SALE)}`, "accent");
    });
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    started.current = false;
    setS(START);
    setStep(0);
    clear();
  }

  const steps = [
    { label: "Dispatch recorded", done: step >= 1 },
    { label: "Sales invoice created", done: step >= 2 },
    { label: "Customer receivable updated", done: step >= 3 },
  ];

  return (
    <DemoPanel
      title="Operza Complete"
      subtitle={`Dispatching ${DISPATCH_QTY} units at ${inr(PRICE_PER_UNIT)} each`}
      footer={
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            Illustrative values, not a live workspace.
          </p>
          <ResetButton onClick={reset} />
        </div>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            On the floor
          </p>
          <div className="mt-1">
            <StatRow
              label="Finished goods"
              value={Math.round(finished).toString()}
              unit="units"
            />
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            In the books
          </p>
          <div className="mt-1">
            <StatRow
              label="Sales invoice"
              value={s.invoiced ? "Created" : "None"}
              tone={s.invoiced ? "good" : "muted"}
            />
            <StatRow
              label="Customer owes"
              value={inr(receivable)}
              tone={s.invoiced ? "accent" : "muted"}
            />
          </div>

          <div className="mt-6">
            <DemoButton onClick={dispatch} disabled={inFlight} variant="accent">
              Dispatch {DISPATCH_QTY} units
            </DemoButton>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            One action, both sides
          </p>
          <ol className="mt-3 space-y-0">
            {steps.map((st, i) => (
              <li key={st.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                      st.done
                        ? "border-brand-500 bg-brand-500"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    {st.done && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`my-1 w-px flex-1 transition-colors duration-300 ${
                        steps[i + 1].done ? "bg-brand-500/60" : "bg-white/12"
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`pb-5 text-sm transition-colors duration-300 ${
                    st.done ? "text-white" : "text-white/35"
                  }`}
                >
                  {st.label}
                </p>
              </li>
            ))}
          </ol>

          <ActivityFeed items={items} empty="Dispatch to see both sides move." />
        </div>
      </div>
    </DemoPanel>
  );
}
