"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// A simplified interactive example of one Operza Factory workflow: choosing a
// batch size and running production against a scripted bill of materials.
//
// SCOPE, and why it is drawn here. This simulation is not the product and
// shares no code with it, so everything it shows has to correspond to
// something Operza actually does. It previously carried a second half, a
// "Purchasing workspace" with supplier names, suggested reorder quantities,
// recommended reorder timing and replenishment-stability messaging. Operza has
// Purchases and Suppliers, but no reorder-suggestion surface, so that half was
// describing a feature that does not exist and has been removed. What is left
// maps one to one onto the real production flow:
//
//   choose a quantity -> check every material -> deduct them ->
//   post the finished units -> report which materials fell below alert level
//
// and, when the run cannot complete, it stops and says so.
//
// The four quantity tiers each land on a different truthful outcome, anchored
// in the BOM figures and alert levels shown on screen:
//
//   qty=25   all materials stay above alert          healthy
//   qty=50   Wood Glue drops below alert             one low
//   qty=100  Wood Planks and Wood Glue below alert   two low
//   qty=200  both would go negative                  BLOCKED, nothing posted
//
// Pure client state: useState, requestAnimationFrame and the existing Tailwind
// keyframes (animate-fade-up, animate-flash). No Framer Motion, no Supabase,
// no persistence.

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

// Tuning: Wood Glue alertLevel raised from 3 → 9 vs rev-3/rev-5 so
// that qty=50 genuinely trips the "approaching threshold" beat
// (8.5L < 9L = LOW). Without this raise, qty=50 ends all-OK and the
// tiered narrative collapses into the same outcome as qty=25.
const BOM: ReadonlyArray<BomItem> = [
  { name: "Wood Planks", stock: 120, requiredPerUnit: 1, alertLevel: 30, unit: "pcs" },
  { name: "Screws", stock: 1000, requiredPerUnit: 4, alertLevel: 200, unit: "pcs" },
  { name: "Wood Glue", stock: 15, requiredPerUnit: 0.13, alertLevel: 9, unit: "L" },
];

const ORDER = {
  reference: "ORD-1142",
  customer: "Acme Furniture",
  dueAt: "Tomorrow · 9:00 AM",
};

const QUANTITY_OPTIONS = [25, 50, 100, 200] as const;
type Qty = (typeof QUANTITY_OPTIONS)[number];

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

// --- Derived row shape ---

type ComputedRow = {
  item: BomItem;
  required: number;
  currentAfter: number;
  visibleStatus: Status | null;
  finalStatus: Status;
};

function buildRows(phase: Phase, progress: number, orderQty: number): ComputedRow[] {
  return BOM.map((item) => {
    const required = item.requiredPerUnit * orderQty;
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

// Would the production run be blocked? True if any material's
// requirement exceeds stock. Determines whether finishedAfter
// posts (production succeeded) or stays at the before-value
// (blocked — no units actually produced).
function wouldBlock(orderQty: number): boolean {
  return BOM.some(
    (item) => item.stock - item.requiredPerUnit * orderQty < 0,
  );
}

// Largest selector tier that won't block production at current stock.
// True absolute max is `min(floor(stock/req))` per material — for our
// scripted BOM that's 115 (Wood Glue is the binding constraint at
// floor(15 / 0.13)). We round down to the nearest existing selector
// tier so that "Run adjusted batch" can reuse the selector system
// without introducing a fifth custom value. Trade-off accepted: at
// our BOM this returns 100, leaving ~15 units of theoretical headroom
// on the table — but operationally honest (real procurement always
// keeps a buffer).
function maxSafeProductionTier(): Qty | null {
  let rawMax = Infinity;
  for (const item of BOM) {
    if (item.requiredPerUnit > 0) {
      rawMax = Math.min(rawMax, Math.floor(item.stock / item.requiredPerUnit));
    }
  }
  if (rawMax === Infinity) return null;
  for (let i = QUANTITY_OPTIONS.length - 1; i >= 0; i--) {
    if (QUANTITY_OPTIONS[i] <= rawMax) return QUANTITY_OPTIONS[i];
  }
  // No selector tier fits — would happen only if even the smallest
  // tier exceeds available stock. Defensive only for our BOM.
  return null;
}

const MAX_SAFE_PRODUCTION = maxSafeProductionTier();

// --- Component ---

export default function InteractiveProductionDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0); // 0..1 during "consuming"
  const [selectedQuantity, setSelectedQuantity] = useState<Qty>(100);

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
    setPhase("idle");
  }

  // Recovery affordance for the blocked tier: swap to the largest
  // non-blocking selector tier, then re-run the sequence. Lets the
  // visitor experience "block → system guidance → recovery" without
  // having to re-pick the quantity by hand.
  function runAdjustedBatch() {
    if (MAX_SAFE_PRODUCTION === null) return;
    setSelectedQuantity(MAX_SAFE_PRODUCTION);
    start();
  }

  const rows = useMemo(
    () => buildRows(phase, progress, selectedQuantity),
    [phase, progress, selectedQuantity],
  );

  const blocked = useMemo(() => wouldBlock(selectedQuantity), [selectedQuantity]);

  // When production would be blocked, finished goods does NOT post —
  // the run gets stopped before commit. So finishedAfter stays at the
  // before-value all the way through the sequence. When production
  // succeeds, finished goods tweens up with progress and lands at
  // before + orderQty.
  const finishedAfter = blocked
    ? PRODUCT.finishedGoodsBefore
    : phase === "completed"
      ? PRODUCT.finishedGoodsBefore + selectedQuantity
      : phase === "consuming"
        ? PRODUCT.finishedGoodsBefore + selectedQuantity * progress
        : PRODUCT.finishedGoodsBefore;

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
        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-slate-200 bg-white shadow-lift">
          <div>
            <OrderHeader
              phase={phase}
              selectedQuantity={selectedQuantity}
              onChangeQuantity={setSelectedQuantity}
              onStart={start}
              onReset={reset}
            />

            <StatusBar phase={phase} blocked={blocked} />

            <InventoryTableDesktop rows={rows} phase={phase} />
            <InventoryTableMobile rows={rows} phase={phase} />

            <FinishedGoodsBlock
              phase={phase}
              finishedAfter={finishedAfter}
              blocked={blocked}
            />

            {alertRow && (
              <OperationalAlert
                row={alertRow}
                key={`${alertRow.item.name}-${alertRow.visibleStatus}`}
              />
            )}

            {phase === "completed" && (
              <RunSummaryPanel
                rows={rows}
                blocked={blocked}
                maxSafe={MAX_SAFE_PRODUCTION}
                onRunAdjusted={runAdjustedBatch}
              />
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

// --- Subcomponents ---

function OrderHeader({
  phase,
  selectedQuantity,
  onChangeQuantity,
  onStart,
  onReset,
}: {
  phase: Phase;
  selectedQuantity: Qty;
  onChangeQuantity: (q: Qty) => void;
  onStart: () => void;
  onReset: () => void;
}) {
  const idle = phase === "idle";
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
          <p className="mt-3 text-xl font-semibold text-slate-900 tabular-nums sm:text-2xl">
            {selectedQuantity} × {PRODUCT.name}
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

      {idle && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Choose production quantity
          </p>
          <div
            role="radiogroup"
            aria-label="Production quantity"
            className="mt-2 grid grid-cols-4 gap-2 sm:max-w-md"
          >
            {QUANTITY_OPTIONS.map((opt) => {
              const active = opt === selectedQuantity;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChangeQuantity(opt)}
                  className={`rounded-lg border px-3 py-2.5 text-base font-semibold tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
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
      )}

      <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {idle && (
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

function StatusBar({ phase, blocked }: { phase: Phase; blocked: boolean }) {
  const message = (() => {
    switch (phase) {
      case "checking":
        return "Checking materials…";
      case "starting":
        return "Production batch starting…";
      case "consuming":
        return "Production in progress…";
      case "completed":
        return blocked
          ? "Production blocked · stockout detected"
          : "Production completed in ~2.6s";
      default:
        return null;
    }
  })();

  if (!message) return null;

  const isActive = phase !== "completed";
  const completedTone = blocked
    ? "border-red-100 bg-red-50/60 text-red-800"
    : "border-emerald-100 bg-emerald-50/60 text-emerald-800";
  const completedDot = blocked ? "bg-red-500" : "bg-emerald-500";

  return (
    <div
      key={`${phase}-${blocked}`}
      className={`flex items-center gap-2.5 border-b px-5 py-2.5 text-[12px] font-medium animate-fade-up sm:px-6 ${
        phase === "completed"
          ? completedTone
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
          <span className={`relative inline-flex h-2 w-2 rounded-full ${completedDot}`} />
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
              {showRequired ? formatValue(row.required, row.item.unit) : <Dash />}
            </div>
            <div className={`text-right font-semibold ${row.visibleStatus ? statusColor(row.visibleStatus) : "text-slate-300"}`}>
              {showRemaining ? formatValue(row.currentAfter, row.item.unit) : <Dash />}
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
                <StatusChip key={row.visibleStatus} status={row.visibleStatus} />
              ) : (
                <Dash />
              )}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
              <MiniStat label="Available" value={formatValue(row.item.stock, row.item.unit)} />
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
      <dd className={`mt-0.5 font-semibold ${tone ? statusColor(tone) : "text-slate-700"}`}>
        {value}
      </dd>
    </div>
  );
}

function FinishedGoodsBlock({
  phase,
  finishedAfter,
  blocked,
}: {
  phase: Phase;
  finishedAfter: number;
  blocked: boolean;
}) {
  const rendered = Math.round(finishedAfter);
  const done = phase === "completed";
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
                done && blocked
                  ? "text-slate-500"
                  : done
                    ? "text-emerald-700"
                    : "text-slate-900"
              }`}
            >
              {rendered}
            </span>
            <span className="text-sm font-medium text-slate-500">units</span>
          </p>
          {done && blocked && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Production blocked, no units posted
            </p>
          )}
        </div>
        <p className="max-w-xs text-xs leading-5 text-slate-500 sm:text-right">
          When the run completes, material stock is deducted and the finished
          units are added.
        </p>
      </div>
    </div>
  );
}

function OperationalAlert({ row }: { row: ComputedRow }) {
  const tone = row.visibleStatus === "insufficient" ? "danger" : "warn";
  const heading =
    tone === "danger"
      ? `Production cannot complete. ${row.item.name} is insufficient.`
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
          Operza surfaces this the moment the threshold is crossed, so a
          stockout does not appear mid-run.
        </span>
      </div>
    </div>
  );
}

function RunSummaryPanel({
  rows,
  blocked,
  maxSafe,
  onRunAdjusted,
}: {
  rows: ComputedRow[];
  blocked: boolean;
  maxSafe: Qty | null;
  onRunAdjusted: () => void;
}) {
  const insufficient = rows.filter((r) => r.finalStatus === "insufficient");
  const low = rows.filter((r) => r.finalStatus === "low");

  let title: string;
  let body: string;
  let reasonText: string | null = null;

  if (blocked) {
    const names = insufficient.map((r) => r.item.name).join(" and ");
    title = "Production blocked.";
    body = "Nothing was deducted and no units were posted.";
    reasonText = `${names} ${insufficient.length > 1 ? "fall" : "falls"} below the minimum production requirement.`;
  } else if (low.length >= 2) {
    const names = low.map((r) => r.item.name).join(" and ");
    title = "Production completed.";
    body = `${low.length} materials are now below their alert level: ${names}.`;
  } else if (low.length === 1) {
    title = "Production completed.";
    body = `${low[0].item.name} is now below its alert level.`;
  } else {
    title = "Production completed.";
    body = "Every material stayed above its alert level.";
  }

  return (
    <div
      key="run-summary"
      className="border-t border-slate-100 bg-white px-5 py-5 animate-fade-up sm:px-6"
    >
      <div className="flex items-start gap-3">
        <SparkleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
            Run summary
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>

          {reasonText && (
            <p className="mt-3 text-xs leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">Reason ·</span>{" "}
              {reasonText}
            </p>
          )}

          {/* The largest selector tier this scripted stock level supports.
              Derived from the same BOM figures shown in the table above, so
              the visitor can check it, and it recovers the blocked run
              without inventing a feature to do it. */}
          {blocked && maxSafe !== null && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-700">
                Largest batch this stock supports
              </p>
              <p className="mt-1.5 flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl font-bold text-slate-900">{maxSafe}</span>
                <span className="text-sm text-slate-600">
                  units, from the stock shown above
                </span>
              </p>
              <button
                type="button"
                onClick={onRunAdjusted}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Run that batch instead
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
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

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 1.5zM10 14.25a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75zM18.5 10a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5h3.5a.75.75 0 01.75.75zM5.75 10a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5h3.5a.75.75 0 01.75.75zM16.013 16.013a.75.75 0 01-1.06 0L12.47 13.53a.75.75 0 011.06-1.06l2.483 2.483a.75.75 0 010 1.06zM7.531 7.531a.75.75 0 01-1.061 0L3.987 5.048a.75.75 0 011.06-1.06l2.484 2.482a.75.75 0 010 1.061zM16.013 3.987a.75.75 0 010 1.061L13.53 7.53a.75.75 0 11-1.06-1.06l2.483-2.483a.75.75 0 011.06 0zM7.531 12.47a.75.75 0 010 1.06l-2.484 2.483a.75.75 0 11-1.06-1.06l2.483-2.483a.75.75 0 011.061 0z" />
    </svg>
  );
}
