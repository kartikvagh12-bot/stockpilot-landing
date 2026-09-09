"use client";

import { useState } from "react";
import {
  ActivityFeed,
  DemoButton,
  DemoPanel,
  ResetButton,
  StatRow,
  inr,
  useActivity,
  useAnimatedNumber,
} from "./demo-ui";

// A supplier bill, a part payment, then the rest. Outstanding falls, the bank
// falls with it, and the bill closes.
//
// This is about recording money that moved: bill, payment, outstanding. It
// claims nothing about GST filing, e-invoicing, tax compliance or bank feeds,
// none of which Operza does.

const BILL = 24800;
const START = { outstanding: BILL, bank: 85000 };
const PART_PAYMENT = 10000;

export default function BooksDemo() {
  const [s, setS] = useState(START);
  const { items, push, clear } = useActivity();

  const outstanding = useAnimatedNumber(s.outstanding);
  const bank = useAnimatedNumber(s.bank);
  const paid = s.outstanding === 0;

  function pay(amount: number) {
    const actual = Math.min(amount, s.outstanding);
    if (actual <= 0) return;
    const nextOutstanding = s.outstanding - actual;
    setS((p) => ({ outstanding: nextOutstanding, bank: p.bank - actual }));
    push(`Payment of ${inr(actual)} recorded against the bill`, "good");
    if (nextOutstanding === 0) push("Bill fully paid", "accent");
  }

  function reset() {
    setS(START);
    clear();
  }

  return (
    <DemoPanel
      title="Supplier bill"
      subtitle={`One bill of ${inr(BILL)} from a materials supplier`}
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
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-white/70">Bill total</span>
            <span className="text-sm font-semibold tabular-nums text-white">
              {inr(BILL)}
            </span>
          </div>

          <div className="mt-1">
            <StatRow
              label="Outstanding"
              value={inr(outstanding)}
              tone={paid ? "good" : "accent"}
              hint={paid ? "Nothing left to pay" : "Still to pay this supplier"}
            />
            <StatRow label="Bank" value={inr(bank)} hint="Balance after payments" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Status
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                paid
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-brand-500/15 text-brand-300"
              }`}
            >
              {paid ? "Paid" : "Open"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <DemoButton onClick={() => pay(PART_PAYMENT)} disabled={paid} variant="accent">
              Record {inr(PART_PAYMENT)}
            </DemoButton>
            <DemoButton onClick={() => pay(s.outstanding)} disabled={paid}>
              Pay the remainder
            </DemoButton>
          </div>
        </div>

        <ActivityFeed items={items} />
      </div>
    </DemoPanel>
  );
}
