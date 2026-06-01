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

// Data is tuned slightly from the literal spec example so the demo arc
// hits all three Status states across the four quantity options:
//   10  → all OK            (calm baseline)
//   25  → all OK            (default)
//   50  → all OK            (still under)
//   100 → Wood Planks LOW   + Wood Glue INSUFFICIENT (crisis moment)
// The only number changed vs the brief is Wood Glue's requiredPerUnit
// (0.04 → 0.18 L per chair) — closer to realistic anyway and makes the
// "Production cannot complete" copy actually reachable. Easy to revert
// if a literal match to the spec is preferred.
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
  // Trim trailing zeros; keep up to two decimals so 0.18 × 25 = 4.5
  // doesn't render as 4.5000000001 from float math.
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-IN")
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${text} ${unit}`;
}

export default function InteractiveProductionDemo() {
  const [qty, setQty] = useState<Qty>(25);

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
      className="section relative"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Try it</span>
          <h2 className="h-section">
            See how production affects inventory.
          </h2>
          <p className="p-section">
            When production runs, raw materials reduce, finished goods
            increase, and low-stock risks become visible instantly.
          </p>
        </div>

        <div className="mt-12 surface overflow-hidden">
          <DemoHeader qty={qty} onChange={setQty} />

          <InventoryTableDesktop rows={rows} />
          <InventoryTableMobile rows={rows} />

          <FinishedGoodsAndAlert
            finishedAfter={finishedAfter}
            alert={alert}
          />
        </div>

        <div className="mt-10 flex flex-col items-center gap-5 text-center">
          <p className="max-w-xl text-sm text-slate-500">
            This is a simplified preview of Operza&apos;s production
            workflow. The live app handles multi-product BOMs, partial
            production runs, optimistic concurrency, and full operational
            history.
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
    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Product
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">
          {PRODUCT.name}
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Production quantity
        </p>
        <div
          role="radiogroup"
          aria-label="Production quantity"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
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
                className={`min-w-[3.25rem] rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InventoryTableDesktop({ rows }: { rows: Row[] }) {
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
          <div className={`text-right font-semibold transition-colors ${afterColor(row.status)}`}>
            {formatValue(row.after, row.item.unit)}
          </div>
          <div className="pl-4 text-right">
            <StatusChip status={row.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryTableMobile({ rows }: { rows: Row[] }) {
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
}: {
  label: string;
  value: string;
  tone?: Status;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 ${
          tone
            ? `font-semibold transition-colors ${afterColor(tone)}`
            : "text-slate-700"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function FinishedGoodsAndAlert({
  finishedAfter,
  alert,
}: {
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
            <span className="text-2xl font-semibold text-slate-900 transition-colors">
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
          key={alert.tone}
          role="status"
          className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm animate-fade-up ${
            alert.tone === "danger"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <AlertIcon tone={alert.tone} />
          <span className="font-medium">{alert.text}</span>
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
