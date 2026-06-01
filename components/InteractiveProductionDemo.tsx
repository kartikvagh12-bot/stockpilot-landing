"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";

// Friction-reducer for cold visitors: lets them feel the core Operza
// loop (BOM → production → stock + finished goods + alerts) without
// signup. Pure client-state — no Supabase, no persistence, no API.
//
// Sits between <Workflow /> (static explainer) and <Features /> (detail
// reinforcement) so the page reads as: explain → try → explore.
//
// Design notes from the rev-2 iteration (after PR #14 first-cut feedback
// "hard to notice, hard to realise it does something, doesn't give
// idea about the app"):
//   * Default qty=100 so the dramatic alert state is visible on first
//     paint — visitor doesn't have to discover it.
//   * Value-led headline ("Catch shortages before production stops")
//     instead of behaviour-led ("See how production affects inventory").
//   * Selector promoted to its own labelled row inside the card,
//     full-width buttons, with an explicit "Try" affordance.
//   * "After" cells animate a brief flash on every qty change (via
//     key={qty} forcing remount of an animate-flash element) so the
//     interactivity is unmissable.
//   * Operational read line + footer line wire the demo to the product:
//     "Operza flags this before you commit" / "This is exactly what
//     Operza shows your floor team before every production run."
//   * Subtle bg-grid texture + slate-50 section bg + shadow-lift on the
//     card differentiate the section from the surrounding white sections
//     without going dark/cinematic.

type BomItem = {
  name: string;
  stock: number;
  requiredPerUnit: number;
  alertLevel: number;
  unit: string;
};

const PRODUCT = {
  name: "Dining Chair",
  finishedGoodsBefore: 20,
};

// Data tuned slightly from the literal brief example so the demo arc
// hits all three Status states across the four quantity options:
//   10  → all OK            (calm baseline)
//   25  → all OK
//   50  → all OK            (still under)
//   100 → Wood Planks LOW   + Wood Glue INSUFFICIENT (crisis moment)
// Only number changed vs the brief is Wood Glue's requiredPerUnit
// (0.04 → 0.18 L per chair) — closer to realistic and makes the
// "Production cannot complete" copy actually reachable.
const BOM: ReadonlyArray<BomItem> = [
  { name: "Wood Planks", stock: 120, requiredPerUnit: 1, alertLevel: 30, unit: "pcs" },
  { name: "Screws", stock: 1000, requiredPerUnit: 4, alertLevel: 200, unit: "pcs" },
  { name: "Wood Glue", stock: 15, requiredPerUnit: 0.18, alertLevel: 3, unit: "L" },
];

const QUANTITY_OPTIONS = [10, 25, 50, 100] as const;
type Qty = (typeof QUANTITY_OPTIONS)[number];

type Status = "ok" | "low" | "insufficient";

type Row = {
  item: BomItem;
  required: number;
  after: number;
  status: Status;
};

function computeRow(item: BomItem, qty: number): Row {
  const required = item.requiredPerUnit * qty;
  const after = item.stock - required;
  let status: Status = "ok";
  if (after < 0) status = "insufficient";
  else if (after < item.alertLevel) status = "low";
  return { item, required, after, status };
}

function formatValue(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-IN")
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${text} ${unit}`;
}

export default function InteractiveProductionDemo() {
  // Start at qty=100 so the visitor lands on the dramatic state
  // (Wood Planks LOW + Wood Glue INSUFFICIENT, danger banner firing).
  // The demo sells the value moment immediately; clicking down to
  // smaller quantities then shows the "all clear" inverse — both
  // directions are educational.
  const [qty, setQty] = useState<Qty>(100);

  const rows = useMemo(
    () => BOM.map((item) => computeRow(item, qty)),
    [qty],
  );
  const finishedAfter = PRODUCT.finishedGoodsBefore + qty;

  const alert = useMemo(() => {
    const insufficient = rows.filter((r) => r.status === "insufficient");
    if (insufficient.length > 0) {
      const names = insufficient.map((r) => r.item.name).join(", ");
      return {
        tone: "danger" as const,
        text: `Production cannot complete at this quantity — ${names} insufficient.`,
      };
    }
    const low = rows.filter((r) => r.status === "low");
    if (low.length > 0) {
      const names = low.map((r) => r.item.name).join(", ");
      return {
        tone: "warn" as const,
        text: `${names} will fall below alert level after this run.`,
      };
    }
    return null;
  }, [rows]);

  return (
    <section
      id="simulator"
      aria-label="Interactive production demo"
      className="section relative isolate overflow-hidden bg-slate-50/60"
    >
      {/* Subtle industrial grid texture, masked top/bottom so the section
          reads as visually distinct from the white Workflow/Features
          sections above and below without being heavy or dark. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60 mask-fade-y"
      />

      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Live preview · no signup</span>
          <h2 className="h-section">
            Catch shortages before production stops.
          </h2>
          <p className="p-section">
            Operza calculates the impact of every production run on your
            raw materials — instantly. Adjust the batch size to see how.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white shadow-lift overflow-hidden">
          <DemoHeader qty={qty} onChange={setQty} />

          <InventoryTableDesktop rows={rows} qty={qty} />
          <InventoryTableMobile rows={rows} qty={qty} />

          <FinishedGoodsAndAlert
            qty={qty}
            finishedAfter={finishedAfter}
            alert={alert}
          />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          This is exactly what Operza shows your floor team before every
          production run.
        </p>

        <div className="mt-10 flex flex-col items-center gap-5 text-center">
          <p className="max-w-xl text-sm text-slate-500">
            The live app handles multi-product BOMs, partial production
            runs, optimistic concurrency, and full operational history.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/health-check" className="btn-primary">
              Take Manufacturing Health Check
            </Link>
            <a href="#contact" className="btn-secondary">
              Book a 20-minute walkthrough
            </a>
            <a
              href={SITE.app}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Open app
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoHeader({
  qty,
  onChange,
}: {
  qty: Qty;
  onChange: (next: Qty) => void;
}) {
  return (
    <div className="border-b border-slate-100 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Product
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {PRODUCT.name}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Interactive
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Try a different production batch size
          </p>
          <p className="hidden text-[11px] text-slate-400 sm:block">
            Click to recalculate ↓
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Production batch size"
          className="mt-2 grid grid-cols-4 gap-2"
        >
          {QUANTITY_OPTIONS.map((opt) => {
            const active = opt === qty;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange(opt)}
                className={`relative rounded-lg border px-3 py-3 text-base font-semibold tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {opt}
                <span
                  className={`mt-0.5 block text-[10px] font-medium uppercase tracking-wide ${
                    active ? "text-white/65" : "text-slate-400"
                  }`}
                >
                  units
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InventoryTableDesktop({ rows, qty }: { rows: Row[]; qty: Qty }) {
  return (
    <div className="hidden sm:block">
      <div className="grid grid-cols-[1.4fr_repeat(3,_1fr)_auto] gap-x-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        <div>Material</div>
        <div className="text-right">Before</div>
        <div className="text-right">Required</div>
        <div className="text-right">After</div>
        <div className="pl-4 text-right">Status</div>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.item.name}
          className={`grid grid-cols-[1.4fr_repeat(3,_1fr)_auto] items-center gap-x-4 px-6 py-3.5 text-sm tabular-nums ${
            i < rows.length - 1 ? "border-b border-slate-100" : ""
          }`}
        >
          <div className="font-medium text-slate-900">{row.item.name}</div>
          <div className="text-right text-slate-700">
            {formatValue(row.item.stock, row.item.unit)}
          </div>
          <div className="text-right text-slate-700">
            {formatValue(row.required, row.item.unit)}
          </div>
          {/* key={`${qty}-${row.item.name}`} forces a re-mount of the
              animated span on every qty change, retriggering animate-flash
              so the value visibly highlights right when it updates. */}
          <div className="text-right">
            <span
              key={`${qty}-${row.item.name}`}
              className={`-mx-1 inline-block rounded px-1 font-semibold transition-colors animate-flash ${afterColor(row.status)}`}
            >
              {formatValue(row.after, row.item.unit)}
            </span>
          </div>
          <div className="pl-4 text-right">
            <StatusChip status={row.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryTableMobile({ rows, qty }: { rows: Row[]; qty: Qty }) {
  return (
    <div className="divide-y divide-slate-100 sm:hidden">
      {rows.map((row) => (
        <div key={row.item.name} className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="font-medium text-slate-900">{row.item.name}</div>
            <StatusChip status={row.status} />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
            <MiniStat
              label="Before"
              value={formatValue(row.item.stock, row.item.unit)}
            />
            <MiniStat
              label="Required"
              value={formatValue(row.required, row.item.unit)}
            />
            <MiniStat
              label="After"
              flashKey={`${qty}-${row.item.name}`}
              value={formatValue(row.after, row.item.unit)}
              tone={row.status}
            />
          </dl>
        </div>
      ))}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  flashKey,
}: {
  label: string;
  value: string;
  tone?: Status;
  flashKey?: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>
      {tone ? (
        <dd className="mt-0.5">
          <span
            key={flashKey}
            className={`-mx-1 inline-block rounded px-1 font-semibold transition-colors animate-flash ${afterColor(tone)}`}
          >
            {value}
          </span>
        </dd>
      ) : (
        <dd className="mt-0.5 text-slate-700">{value}</dd>
      )}
    </div>
  );
}

function FinishedGoodsAndAlert({
  qty,
  finishedAfter,
  alert,
}: {
  qty: Qty;
  finishedAfter: number;
  alert: { tone: "warn" | "danger"; text: string } | null;
}) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Finished goods · {PRODUCT.name}
          </p>
          <p className="mt-1 flex items-baseline gap-2 tabular-nums">
            <span className="text-base font-medium text-slate-500">
              {PRODUCT.finishedGoodsBefore}
            </span>
            <ArrowRight className="h-3.5 w-3.5 self-center text-slate-400" />
            <span
              key={qty}
              className="-mx-1 inline-block animate-flash rounded px-1 text-2xl font-semibold text-slate-900 transition-colors"
            >
              {finishedAfter}
            </span>
            <span className="text-sm font-medium text-slate-500">units</span>
          </p>
        </div>
        <p className="max-w-xs text-xs leading-5 text-slate-500 sm:text-right">
          Atomic write — raw materials deducted and finished goods updated
          in one transaction.
        </p>
      </div>

      {alert && (
        <div
          key={`${alert.tone}-${qty}`}
          role="status"
          className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm animate-fade-up ${
            alert.tone === "danger"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <AlertIcon tone={alert.tone} />
          <div>
            <span className="font-medium">{alert.text}</span>
            <span
              className={`mt-1 block text-xs font-medium ${
                alert.tone === "danger" ? "text-red-700/80" : "text-amber-700/80"
              }`}
            >
              Operza flags this before you commit — no surprise stockouts.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  if (status === "insufficient") {
    return (
      <Chip dotClass="bg-red-500" textClass="bg-red-100 text-red-700">
        Insufficient
      </Chip>
    );
  }
  if (status === "low") {
    return (
      <Chip dotClass="bg-amber-500" textClass="bg-amber-100 text-amber-700">
        Low
      </Chip>
    );
  }
  return (
    <Chip dotClass="bg-emerald-500" textClass="bg-emerald-50 text-emerald-700">
      OK
    </Chip>
  );
}

function Chip({
  dotClass,
  textClass,
  children,
}: {
  dotClass: string;
  textClass: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${textClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function afterColor(status: Status): string {
  if (status === "insufficient") return "text-red-700";
  if (status === "low") return "text-amber-700";
  return "text-slate-900";
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlertIcon({ tone }: { tone: "warn" | "danger" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
        tone === "danger" ? "text-red-500" : "text-amber-500"
      }`}
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
