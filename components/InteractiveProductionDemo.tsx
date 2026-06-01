"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";

// Scenario-based operational simulation (rev-3 → rev-5, 2026-06-01).
//
// Started life (rev-1/rev-2) as a "quantity calculator" — click
// 10/25/50/100, watch numbers recompute. That explained inventory
// math but didn't sell the product. Rev-3 pivoted to a scripted
// production scenario (idle → checking → starting → consuming →
// completed). Rev-4 tacked on an in-card "Generate reorder suggestion"
// panel so the experience didn't end at "production ran." Rev-5
// (current) replaces the in-card reveal with an actual *workspace
// switch* so the demo reads as connected operational systems instead
// of one smart card with hidden sub-panels.
//
// End-to-end flow (rev-5):
//   PRODUCTION workspace
//     1. Incoming order card (100 chairs, due 9 AM tomorrow)
//     2. Press "Run Production"
//     3. Floor sequence runs (~2.6s): RAF counter tween, status
//        chips appear as values cross alert thresholds, danger /
//        warning banner fades in mid-tween
//     4. Recommendation panel surfaces with a *workspace-nav* CTA:
//        "2 MATERIALS BELOW THRESHOLD · Open Purchasing workspace →"
//   PURCHASING workspace
//     5. Card content swaps (key= remount + workspace-in keyframe
//        = subtle 420ms slide-in-from-right + fade). The whole
//        operational area changes, not a hidden panel reveal.
//     6. Replenishment table shows Material / Supplier / Suggested
//        qty / Coverage; insight row: "Recommended reorder timing —
//        within the next 24 hours" + "Production stability restored
//        after replenishment."
//     7. "Back to production" preserves state and round-trips.
//        "Run scenario again" resets the whole demo to idle/production.
//
// Pure client state. No Supabase, no API, no persistence, no Framer
// Motion. Just useState + requestAnimationFrame + Tailwind keyframes
// (animate-fade-up, animate-flash, animate-workspace-in). Premium /
// restrained throughout — total production sequence ~2.6s, workspace
// transition ~420ms.

// --- Domain ---

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

// Data sized so that 100 chairs (the scripted order quantity below):
//   - Wood Planks: 120 → 20  (below alert 30 → LOW)
//   - Screws:     1000 → 600 (above alert 200 → OK)
//   - Wood Glue:    15 → 2   (below alert 3  → LOW)
// Production *completes* with two stock warnings — which is the
// operational-narrative beat the brief asks for ("Production completed
// successfully. 2 raw materials now below alert level"), not a block.
const BOM: ReadonlyArray<BomItem> = [
  { name: "Wood Planks", stock: 120, requiredPerUnit: 1, alertLevel: 30, unit: "pcs" },
  { name: "Screws", stock: 1000, requiredPerUnit: 4, alertLevel: 200, unit: "pcs" },
  { name: "Wood Glue", stock: 15, requiredPerUnit: 0.13, alertLevel: 3, unit: "L" },
];

const ORDER = {
  reference: "ORD-1142",
  quantity: 100,
  customer: "Acme Furniture",
  dueAt: "Tomorrow · 9:00 AM",
};

// Supplier name + coverage label are authored, not derived. The
// supplier is obviously fictional; the coverage labels are slightly
// rounded for visual variety in the table (raw computation lands
// ~3.2 batches for both, but ~3 / ~4 reads less templated). The
// underlying reorder quantity (`suggestedReorder()` below) stays
// derived so the table number actually reflects the production math.
const SUPPLIER_INFO: Record<string, { supplier: string; coverage: string }> = {
  "Wood Planks": { supplier: "TimberWorks", coverage: "~3 batches" },
  "Screws": { supplier: "FastFix Hardware", coverage: "~5 batches" },
  "Wood Glue": { supplier: "ChemBond", coverage: "~4 batches" },
};

// --- Workspace router ---

type Workspace = "production" | "purchasing";

// --- Phase machine ---

type Phase = "idle" | "checking" | "starting" | "consuming" | "completed";

const PHASE_DURATIONS_MS = {
  checking: 600,
  starting: 500,
  consuming: 1500,
};

// --- Status helpers ---

type Status = "ok" | "low" | "insufficient";

function statusForAfter(after: number, alertLevel: number): Status {
  if (after < 0) return "insufficient";
  if (after < alertLevel) return "low";
  return "ok";
}

function statusColor(status: Status): string {
  if (status === "insufficient") return "text-red-700";
  if (status === "low") return "text-amber-700";
  return "text-slate-900";
}

function formatValue(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-IN")
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${text} ${unit}`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Derived reorder quantity: enough to cover three future batches at the
// current consumption rate, rounded up to a "nice" step per unit so the
// suggestion looks like a procurement number a human would actually
// type (300 pcs, 40 L), not a raw computation (283.7). Marketing copy
// elsewhere claims "~3 future production batches" — using a derived
// value keeps that claim honest.
function suggestedReorder(item: BomItem, currentAfter: number): number {
  const required = item.requiredPerUnit * ORDER.quantity;
  const needed = required * 3 - currentAfter;
  const step = item.unit === "L" ? 5 : 50;
  return Math.max(step, Math.ceil(needed / step) * step);
}

// --- Derived row shape ---

type ComputedRow = {
  item: BomItem;
  required: number;          // total consumed at full quantity
  currentAfter: number;      // current animated "Remaining" value
  visibleStatus: Status | null; // chip / color, null while pre-checking
  finalStatus: Status;        // final state at end of sequence
};

function buildRows(phase: Phase, progress: number): ComputedRow[] {
  return BOM.map((item) => {
    const required = item.requiredPerUnit * ORDER.quantity;
    const finalAfter = item.stock - required;
    const finalStatus = statusForAfter(finalAfter, item.alertLevel);

    let currentAfter = item.stock;
    let visibleStatus: Status | null = null;
    if (phase === "consuming") {
      currentAfter = item.stock - required * progress;
      visibleStatus = statusForAfter(currentAfter, item.alertLevel);
    } else if (phase === "completed") {
      currentAfter = finalAfter;
      visibleStatus = finalStatus;
    }
    return { item, required, currentAfter, visibleStatus, finalStatus };
  });
}

// --- Component ---

export default function InteractiveProductionDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0); // 0..1 during "consuming"
  // The operational workspace router (rev-5). Production state (phase,
  // progress) is preserved across workspace navigations, so "Back to
  // production" returns to the completed state without replay.
  const [workspace, setWorkspace] = useState<Workspace>("production");

  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  useEffect(() => () => clearTimers(), []);

  function start() {
    clearTimers();
    setProgress(0);
    setWorkspace("production");
    setPhase("checking");

    timeoutsRef.current.push(
      setTimeout(() => setPhase("starting"), PHASE_DURATIONS_MS.checking),
    );
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase("consuming");
        const startTs = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - startTs) / PHASE_DURATIONS_MS.consuming);
          setProgress(easeOutCubic(t));
          if (t < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            rafRef.current = null;
            setPhase("completed");
          }
        };
        rafRef.current = requestAnimationFrame(tick);
      }, PHASE_DURATIONS_MS.checking + PHASE_DURATIONS_MS.starting),
    );
  }

  function reset() {
    clearTimers();
    setProgress(0);
    setWorkspace("production");
    setPhase("idle");
  }

  const rows = buildRows(phase, progress);
  const finishedAfter =
    phase === "completed"
      ? PRODUCT.finishedGoodsBefore + ORDER.quantity
      : phase === "consuming"
        ? PRODUCT.finishedGoodsBefore + ORDER.quantity * progress
        : PRODUCT.finishedGoodsBefore;

  // The alert fires as soon as any row visibly crosses below alert
  // level — i.e. mid-tween — which is the moment that sells the
  // "operationally intelligent" beat. We pick the most-severe row
  // (insufficient > low) and surface its name in the copy.
  const alertRow = (phase === "consuming" || phase === "completed")
    ? (rows.find((r) => r.visibleStatus === "insufficient")
       ?? rows.find((r) => r.visibleStatus === "low"))
    : undefined;

  return (
    <section
      id="simulator"
      aria-label="Interactive production simulation"
      className="section relative isolate overflow-hidden bg-slate-50/60"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60 mask-fade-y"
      />

      <div className="container-page">
        <div className="max-w-2xl">
          <span className="eyebrow">Live operational preview</span>
          <h2 className="h-section">Can we fulfil this order today?</h2>
          <p className="p-section">
            A real production order — ready to run. Press
            <span className="font-medium text-slate-800"> Run Production </span>
            to see how Operza checks materials, deducts stock, and
            surfaces alerts before the floor commits.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white shadow-lift overflow-hidden">
          {workspace === "production" ? (
            <div key="production" className="animate-workspace-in">
              <OrderHeader phase={phase} onStart={start} onReset={reset} />

              <StatusBar phase={phase} />

              <InventoryTableDesktop rows={rows} phase={phase} />
              <InventoryTableMobile rows={rows} phase={phase} />

              <FinishedGoodsBlock phase={phase} finishedAfter={finishedAfter} />

              {alertRow && (
                <OperationalAlert
                  row={alertRow}
                  key={`${alertRow.item.name}-${alertRow.visibleStatus}`}
                />
              )}

              {phase === "completed" && (
                <RecommendationPanel
                  rows={rows}
                  onOpenPurchasing={() => setWorkspace("purchasing")}
                />
              )}
            </div>
          ) : (
            <div key="purchasing" className="animate-workspace-in">
              <PurchasingWorkspace
                rows={rows}
                onBack={() => setWorkspace("production")}
                onReset={reset}
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          This is exactly what Operza shows your floor team before every
          production run.
        </p>

        <div className="mt-10 flex flex-col items-center gap-5 text-center">
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

// --- Subcomponents ---

function OrderHeader({
  phase,
  onStart,
  onReset,
}: {
  phase: Phase;
  onStart: () => void;
  onReset: () => void;
}) {
  const running = phase === "checking" || phase === "starting" || phase === "consuming";
  const done = phase === "completed";

  return (
    <div className="border-b border-slate-100 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              New order
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              {ORDER.reference}
            </span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
            {ORDER.quantity} × {PRODUCT.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">{ORDER.customer}</p>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Delivery due
          </p>
          <p className="text-sm font-semibold text-slate-900">{ORDER.dueAt}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {phase === "idle" && (
          <button
            type="button"
            onClick={onStart}
            className="btn-primary group h-12 px-6 text-base"
          >
            <PlayIcon className="h-4 w-4" />
            Run Production
          </button>
        )}

        {running && (
          <button
            type="button"
            disabled
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-900/85 px-6 text-base font-semibold text-white"
          >
            <Spinner className="h-4 w-4" />
            Running production…
          </button>
        )}

        {done && (
          <>
            <span className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-800">
              <CheckIcon className="h-4 w-4" />
              Production completed
            </span>
            <button
              type="button"
              onClick={onReset}
              className="btn-secondary h-12 text-sm"
            >
              Run again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBar({ phase }: { phase: Phase }) {
  const message = (() => {
    switch (phase) {
      case "checking":
        return "Checking raw materials…";
      case "starting":
        return "Production batch starting…";
      case "consuming":
        return "Production in progress…";
      case "completed":
        return "Production completed in ~2.6s";
      default:
        return null;
    }
  })();

  if (!message) return null;

  const isActive = phase !== "completed";
  return (
    <div
      key={phase}
      className={`flex items-center gap-2.5 border-b px-5 py-2.5 text-[12px] font-medium animate-fade-up sm:px-6 ${
        phase === "completed"
          ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
          : "border-slate-100 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {isActive ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </>
        ) : (
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        )}
      </span>
      {message}
    </div>
  );
}

function InventoryTableDesktop({
  rows,
  phase,
}: {
  rows: ComputedRow[];
  phase: Phase;
}) {
  const showRequired = phase !== "idle";
  const showRemaining = phase === "consuming" || phase === "completed";

  return (
    <div className="hidden sm:block">
      <div className="grid grid-cols-[1.4fr_repeat(3,_1fr)_auto] gap-x-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        <div>Material</div>
        <div className="text-right">Available</div>
        <div className="text-right">Required</div>
        <div className="text-right">Remaining</div>
        <div className="pl-4 text-right">Status</div>
      </div>
      {rows.map((row, i) => {
        const updating = phase === "consuming";
        return (
          <div
            key={row.item.name}
            className={`grid grid-cols-[1.4fr_repeat(3,_1fr)_auto] items-center gap-x-4 px-6 py-3.5 text-sm tabular-nums transition-colors ${
              i < rows.length - 1 ? "border-b border-slate-100" : ""
            } ${updating ? "bg-brand-50/30" : ""}`}
          >
            <div className="font-medium text-slate-900">{row.item.name}</div>
            <div className="text-right text-slate-700">
              {formatValue(row.item.stock, row.item.unit)}
            </div>
            <div className="text-right text-slate-700">
              {showRequired
                ? formatValue(row.required, row.item.unit)
                : <Dash />}
            </div>
            <div className={`text-right font-semibold ${row.visibleStatus ? statusColor(row.visibleStatus) : "text-slate-300"}`}>
              {showRemaining
                ? formatValue(row.currentAfter, row.item.unit)
                : <Dash />}
            </div>
            <div className="pl-4 text-right">
              {row.visibleStatus ? (
                <StatusChip
                  key={row.visibleStatus}
                  status={row.visibleStatus}
                />
              ) : (
                <Dash />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InventoryTableMobile({
  rows,
  phase,
}: {
  rows: ComputedRow[];
  phase: Phase;
}) {
  const showRequired = phase !== "idle";
  const showRemaining = phase === "consuming" || phase === "completed";

  return (
    <div className="divide-y divide-slate-100 sm:hidden">
      {rows.map((row) => {
        const updating = phase === "consuming";
        return (
          <div
            key={row.item.name}
            className={`px-5 py-4 transition-colors ${updating ? "bg-brand-50/30" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium text-slate-900">{row.item.name}</div>
              {row.visibleStatus ? (
                <StatusChip
                  key={row.visibleStatus}
                  status={row.visibleStatus}
                />
              ) : (
                <Dash />
              )}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
              <MiniStat
                label="Available"
                value={formatValue(row.item.stock, row.item.unit)}
              />
              <MiniStat
                label="Required"
                value={showRequired ? formatValue(row.required, row.item.unit) : "—"}
              />
              <MiniStat
                label="Remaining"
                value={showRemaining ? formatValue(row.currentAfter, row.item.unit) : "—"}
                tone={row.visibleStatus ?? undefined}
              />
            </dl>
          </div>
        );
      })}
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
        className={`mt-0.5 font-semibold ${
          tone ? statusColor(tone) : "text-slate-700"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function FinishedGoodsBlock({
  phase,
  finishedAfter,
}: {
  phase: Phase;
  finishedAfter: number;
}) {
  const rendered = Math.round(finishedAfter);
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
            <ArrowRightIcon className="h-3.5 w-3.5 self-center text-slate-400" />
            <span
              className={`text-2xl font-semibold transition-colors ${
                phase === "completed" ? "text-emerald-700" : "text-slate-900"
              }`}
            >
              {rendered}
            </span>
            <span className="text-sm font-medium text-slate-500">units</span>
          </p>
        </div>
        <p className="max-w-xs text-xs leading-5 text-slate-500 sm:text-right">
          Atomic write — raw materials deducted and finished goods updated
          in one transaction.
        </p>
      </div>
    </div>
  );
}

function OperationalAlert({ row }: { row: ComputedRow }) {
  const tone = row.visibleStatus === "insufficient" ? "danger" : "warn";
  const heading =
    tone === "danger"
      ? `Production cannot complete — ${row.item.name} insufficient.`
      : `${row.item.name} dropped below safety stock level.`;
  return (
    <div
      role="status"
      className={`mx-5 mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm animate-fade-up sm:mx-6 sm:mb-6 ${
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <AlertIcon tone={tone} />
      <div>
        <span className="font-medium">{heading}</span>
        <span
          className={`mt-1 block text-xs font-medium ${
            tone === "danger" ? "text-red-700/80" : "text-amber-700/80"
          }`}
        >
          Operza surfaces this the moment the threshold is crossed — no
          surprise stockouts mid-run.
        </span>
      </div>
    </div>
  );
}

function RecommendationPanel({
  rows,
  onOpenPurchasing,
}: {
  rows: ComputedRow[];
  onOpenPurchasing: () => void;
}) {
  const insufficient = rows.filter((r) => r.finalStatus === "insufficient");
  const low = rows.filter((r) => r.finalStatus === "low");
  const belowThreshold = insufficient.length + low.length;

  let title: string;
  let body: string;

  if (insufficient.length > 0) {
    const names = insufficient.map((r) => r.item.name).join(", ");
    title = `Production completed with shortfall on ${insufficient.length} material${insufficient.length > 1 ? "s" : ""}.`;
    body = `Reorder ${names} immediately — the next run will block until stock is replenished.`;
  } else if (low.length > 0) {
    const names = low.map((r) => r.item.name).join(" and ");
    title = `Production completed. ${low.length} raw material${low.length > 1 ? "s" : ""} now below alert level.`;
    body = `Schedule reorders for ${names} before the next batch — Operza recommends acting before the floor runs out.`;
  } else {
    title = "Production completed successfully.";
    body = "All stock levels remain within healthy range.";
  }

  return (
    <div
      key="recommendation"
      className="border-t border-slate-100 bg-white px-5 py-5 animate-fade-up sm:px-6"
    >
      <div className="flex items-start gap-3">
        <SparkleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
            Operza recommends
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>

          {belowThreshold > 0 && (
            <button
              type="button"
              onClick={onOpenPurchasing}
              className="group mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[20rem]"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                  {belowThreshold} material{belowThreshold > 1 ? "s" : ""} below threshold
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  Open Purchasing workspace
                </p>
              </div>
              <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PurchasingWorkspace({
  rows,
  onBack,
  onReset,
}: {
  rows: ComputedRow[];
  onBack: () => void;
  onReset: () => void;
}) {
  const items = rows
    .filter((r) => r.finalStatus !== "ok")
    .map((r) => ({
      name: r.item.name,
      unit: r.item.unit,
      qty: suggestedReorder(r.item, r.currentAfter),
      supplier: SUPPLIER_INFO[r.item.name]?.supplier ?? "—",
      coverage: SUPPLIER_INFO[r.item.name]?.coverage ?? "~3 batches",
    }));

  return (
    <>
      {/* Workspace header — visually distinct from the Production order
          header to sell the "moved to another area" feel. */}
      <div className="border-b border-slate-100 bg-slate-50/40 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Back to production
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700">
            <PackageIcon className="h-2.5 w-2.5" />
            Workspace
          </span>
        </div>
        <p className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
          Purchasing
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Replenishment suggestions generated from production order{" "}
          <span className="font-mono text-slate-700">{ORDER.reference}</span>.
        </p>
      </div>

      {/* Suggestions table — desktop */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr] gap-x-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          <div>Material</div>
          <div>Supplier</div>
          <div className="text-right">Suggested qty</div>
          <div className="text-right">Coverage</div>
        </div>
        {items.map((it, i) => (
          <div
            key={it.name}
            style={{ animationDelay: `${i * 90}ms` }}
            className={`grid grid-cols-[1.3fr_1.3fr_1fr_1fr] items-center gap-x-4 px-6 py-3.5 text-sm tabular-nums animate-fade-up ${
              i < items.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div className="font-medium text-slate-900">{it.name}</div>
            <div className="text-slate-700">{it.supplier}</div>
            <div className="text-right font-semibold text-slate-900">
              {it.qty.toLocaleString("en-IN")} {it.unit}
            </div>
            <div className="text-right text-slate-700">{it.coverage}</div>
          </div>
        ))}
      </div>

      {/* Suggestions — mobile */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {items.map((it, i) => (
          <div
            key={it.name}
            style={{ animationDelay: `${i * 90}ms` }}
            className="px-5 py-4 animate-fade-up"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{it.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {it.supplier} · {it.coverage}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {it.qty.toLocaleString("en-IN")} {it.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Operational insights */}
      <div
        className="border-t border-slate-100 bg-brand-50/20 px-5 py-5 animate-fade-up sm:px-6"
        style={{ animationDelay: `${items.length * 90 + 60}ms` }}
      >
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5 text-slate-700">
            <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
            <span>
              Recommended reorder timing —{" "}
              <span className="font-semibold text-slate-900">within the next 24 hours</span>.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-slate-700">
            <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>
              Production stability restored after replenishment.
            </span>
          </li>
        </ul>
      </div>

      {/* Footer with the run-again escape hatch */}
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-slate-500">
          One operational chain — production → purchasing → stability restored.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary h-10 text-sm"
        >
          Run scenario again
        </button>
      </div>
    </>
  );
}

// --- Atoms ---

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
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide animate-fade-up ${textClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function Dash() {
  return <span className="text-slate-300">—</span>;
}

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6.3 4.3a1 1 0 011.5-.87l8.1 5.06a1 1 0 010 1.7l-8.1 5.07a1 1 0 01-1.5-.86V4.3z" />
    </svg>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`animate-spin ${className}`}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M17 10a7 7 0 00-7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
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

function ArrowLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
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

function PackageIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2.5L3 5.5v9L10 17.5l7-3v-9L10 2.5z" />
      <path d="M3 5.5l7 3 7-3" />
      <path d="M10 8.5v9" />
    </svg>
  );
}

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" />
    </svg>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 1.5zM10 14.25a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75zM18.5 10a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5h3.5a.75.75 0 01.75.75zM5.75 10a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5h3.5a.75.75 0 01.75.75zM16.013 16.013a.75.75 0 01-1.06 0L12.47 13.53a.75.75 0 011.06-1.06l2.483 2.483a.75.75 0 010 1.06zM7.531 7.531a.75.75 0 01-1.061 0L3.987 5.048a.75.75 0 011.06-1.06l2.484 2.482a.75.75 0 010 1.061zM16.013 3.987a.75.75 0 010 1.061L13.53 7.53a.75.75 0 11-1.06-1.06l2.483-2.483a.75.75 0 011.06 0zM7.531 12.47a.75.75 0 010 1.06l-2.484 2.483a.75.75 0 11-1.06-1.06l2.483-2.483a.75.75 0 011.061 0z" />
    </svg>
  );
}
