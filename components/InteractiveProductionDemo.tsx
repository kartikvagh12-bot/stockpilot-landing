"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";

// Scenario-based operational simulation (rev-3 → rev-7, 2026-06-01).
//
// Started life (rev-1/rev-2) as a "quantity calculator" — click
// 10/25/50/100, watch numbers recompute. That explained inventory
// math but didn't sell the product. Rev-3 pivoted to a scripted
// production scenario (idle → checking → starting → consuming →
// completed). Rev-4 added an in-card reorder reveal. Rev-5 replaced
// that with a real workspace switch (Production ↔ Purchasing).
// Rev-6 (current) brings the quantity selector back — but as an
// operational decision-making input, not a calculator dial:
// different quantities deliberately trigger different downstream
// outcomes across the whole chain.
//
// Operational decision tiers (anchored in BOM data + alertLevel
// tuning so each quantity tells a different story):
//   qty=25  → all OK                                       healthy
//   qty=50  → Wood Glue LOW                                minor
//   qty=100 → Wood Planks + Wood Glue LOW                  moderate
//   qty=200 → Planks + Glue would go INSUFFICIENT          urgent
//                (production BLOCKED — no units posted)
//
// Each tier flows through the full chain:
//   * order header reflects the chosen quantity live
//   * production sequence runs the same ~2.6s flow
//   * material rows tween + status chips appear at thresholds
//   * an operational alert banner (warn / danger tone) fades in
//   * the recommendation panel copy adapts to the tier
//   * the workspace-nav tile becomes red & "Urgent" at qty=200
//   * the purchasing workspace tier-adapts: reorder quantities
//     scale, coverage labels recompute, the timing insight shifts
//     from "72h" → "24h" → "Immediate action recommended" with
//     stability flipping from "restored" → "unstable until replen."
//
// Production state (phase, progress, selectedQuantity) is preserved
// across workspace navigations, so "Back to production" round-trips
// without replay. Pure client state — useState + RAF + Tailwind
// keyframes (animate-fade-up, animate-flash, animate-workspace-in).
// No Framer Motion. No Supabase. No persistence.
//
// Rev-7 polish (same day, no new modules):
// * Blocked recovery: a "Maximum safe production" tile inside the
//   recommendation panel surfaces `maxSafeProductionTier()` (largest
//   selector tier that won't block — 100 for our scripted BOM) plus
//   a "Run adjusted batch" CTA. Clicking it sets the selector to the
//   safe tier and re-runs the sequence — visitor experiences
//   block → guidance → recovery in a single click.
// * Operational reasoning: short "Reason · Planks and Glue fall below
//   minimum production requirement" line in the blocked state, sits
//   between the recommendation body and the recovery tile.
// * System metadata footer: small all-caps line "Inventory validated
//   in 240ms · Logged just now" at the bottom of the recommendation
//   panel — quiet "this software is real and active" signal.
// * Workspace identity: the demo card gains a constant 4px left
//   border that animates color (slate-200 → brand-500) when entering
//   the Purchasing workspace. Subtle module-identity marker; no
//   layout shift because the border width is constant.

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

// Supplier label per material is authored. Coverage labels are now
// computed via coverageLabel() so they vary honestly with the order
// quantity (rev-5 had them authored too — moved to derivation since
// they're a function of math the visitor can see).
const SUPPLIER_INFO: Record<string, { supplier: string }> = {
  "Wood Planks": { supplier: "TimberWorks" },
  "Screws": { supplier: "FastFix Hardware" },
  "Wood Glue": { supplier: "ChemBond" },
};

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

// Reorder enough to cover 3 future batches of the chosen size,
// rounded up to a nice procurement step (50 pcs / 5 L). We do NOT
// subtract currentAfter — at high quantities currentAfter goes
// negative, which would inflate the suggestion. coverageLabel()
// later reports honest post-reorder coverage so the marketing claim
// matches the data.
function suggestedReorder(item: BomItem, orderQty: number): number {
  const required = item.requiredPerUnit * orderQty;
  const target = required * 3;
  const step = item.unit === "L" ? 5 : 50;
  return Math.max(step, Math.ceil(target / step) * step);
}

function coverageLabel(
  item: BomItem,
  currentAfter: number,
  reorderQty: number,
  orderQty: number,
): string {
  const required = item.requiredPerUnit * orderQty;
  if (required <= 0) return "—";
  const totalAfter = currentAfter + reorderQty;
  const batches = Math.max(1, Math.round(totalAfter / required));
  return `~${batches} batch${batches !== 1 ? "es" : ""}`;
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

// Tiny "system metadata" detail used in the recommendation panel
// footer. Hardcoded (not Math.random) to keep SSR/CSR hydration in
// lockstep — no risk of "Validated in 217ms" on the server and
// "Validated in 263ms" on the client.
const VALIDATION_MS = 240;

// --- Workspace router ---

type Workspace = "production" | "purchasing";

// --- Operational urgency tier (derived from final row statuses) ---

type Urgency = {
  tier: "healthy" | "minor" | "moderate" | "urgent";
  belowThreshold: number;
  navEyebrow: string | null;          // text shown on the workspace-nav tile
  navTone: "warn" | "danger" | "ok";
  timingLabel: string;
  timingTone: "normal" | "danger";
  stabilityLabel: string;
  stabilityTone: "ok" | "warn";
};

function urgencyForRows(rows: ComputedRow[]): Urgency {
  const insufficient = rows.filter((r) => r.finalStatus === "insufficient").length;
  const low = rows.filter((r) => r.finalStatus === "low").length;
  const belowThreshold = insufficient + low;

  if (insufficient > 0) {
    return {
      tier: "urgent",
      belowThreshold,
      navEyebrow: `Urgent · ${insufficient} material${insufficient > 1 ? "s" : ""} short`,
      navTone: "danger",
      timingLabel: "Immediate action recommended",
      timingTone: "danger",
      stabilityLabel: "Production capacity unstable until replenishment completes.",
      stabilityTone: "warn",
    };
  }
  if (low >= 2) {
    return {
      tier: "moderate",
      belowThreshold,
      navEyebrow: `${low} materials below threshold`,
      navTone: "warn",
      timingLabel: "Within the next 24 hours",
      timingTone: "normal",
      stabilityLabel: "Production stability restored after replenishment.",
      stabilityTone: "ok",
    };
  }
  if (low === 1) {
    return {
      tier: "minor",
      belowThreshold,
      navEyebrow: "1 material approaching threshold",
      navTone: "warn",
      timingLabel: "Within the next 72 hours",
      timingTone: "normal",
      stabilityLabel: "Production stability restored after replenishment.",
      stabilityTone: "ok",
    };
  }
  return {
    tier: "healthy",
    belowThreshold: 0,
    navEyebrow: null,
    navTone: "ok",
    timingLabel: "Next scheduled review",
    timingTone: "normal",
    stabilityLabel: "All materials at healthy levels.",
    stabilityTone: "ok",
  };
}

// --- Component ---

export default function InteractiveProductionDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0); // 0..1 during "consuming"
  const [workspace, setWorkspace] = useState<Workspace>("production");
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

  const urgency = useMemo(() => urgencyForRows(rows), [rows]);

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
            A real production order, four possible batch sizes — each one
            triggers a different operational outcome. Pick a quantity, press
            <span className="font-medium text-slate-800"> Run Production</span>,
            and see exactly what Operza checks, deducts, and alerts on before
            the floor commits.
          </p>
        </div>

        <div
          className={`mt-12 rounded-2xl border border-slate-200 border-l-4 bg-white shadow-lift overflow-hidden transition-colors duration-300 ${
            workspace === "purchasing" ? "border-l-brand-500" : "border-l-slate-200"
          }`}
        >
          {workspace === "production" ? (
            <div key="production" className="animate-workspace-in">
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
                <RecommendationPanel
                  rows={rows}
                  urgency={urgency}
                  blocked={blocked}
                  maxSafe={MAX_SAFE_PRODUCTION}
                  onOpenPurchasing={() => setWorkspace("purchasing")}
                  onRunAdjusted={runAdjustedBatch}
                />
              )}
            </div>
          ) : (
            <div key="purchasing" className="animate-workspace-in">
              <PurchasingWorkspace
                rows={rows}
                urgency={urgency}
                orderQty={selectedQuantity}
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
        return "Checking raw materials…";
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
              Production blocked — no units posted
            </p>
          )}
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
  urgency,
  blocked,
  maxSafe,
  onOpenPurchasing,
  onRunAdjusted,
}: {
  rows: ComputedRow[];
  urgency: Urgency;
  blocked: boolean;
  maxSafe: Qty | null;
  onOpenPurchasing: () => void;
  onRunAdjusted: () => void;
}) {
  const insufficient = rows.filter((r) => r.finalStatus === "insufficient");
  const low = rows.filter((r) => r.finalStatus === "low");

  let title: string;
  let body: string;
  let reasonText: string | null = null;

  if (blocked) {
    title = `Production blocked — materials would have run out mid-batch.`;
    body = `Operza would prevent this run in the live app. Here's what's possible with your current stock:`;
    const names = insufficient.map((r) => r.item.name).join(" and ");
    reasonText = `${names} ${insufficient.length > 1 ? "fall" : "falls"} below the minimum production requirement.`;
  } else if (low.length >= 2) {
    const names = low.map((r) => r.item.name).join(" and ");
    title = `Production completed. ${low.length} raw materials now below alert level.`;
    body = `Schedule reorders for ${names} before the next batch — Operza recommends acting before the floor runs out.`;
  } else if (low.length === 1) {
    const itemName = low[0].item.name;
    title = `Production completed. ${itemName} is approaching its reorder threshold.`;
    body = `Schedule a top-up for ${itemName} before the next moderate batch — Operza recommends planning ahead.`;
  } else {
    title = "Production completed successfully.";
    body = "All materials remain within healthy stock levels — no replenishment needed.";
  }

  const showNavTile = urgency.belowThreshold > 0;
  const isUrgent = urgency.navTone === "danger";

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

          {reasonText && (
            <p className="mt-3 text-xs leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">Reason ·</span>{" "}
              {reasonText}
            </p>
          )}

          {blocked && maxSafe !== null && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-700">
                Maximum safe production
              </p>
              <p className="mt-1.5 flex items-baseline gap-2 tabular-nums">
                <span className="text-2xl font-bold text-slate-900">{maxSafe}</span>
                <span className="text-sm text-slate-600">
                  units with current inventory
                </span>
              </p>
              <button
                type="button"
                onClick={onRunAdjusted}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Run adjusted batch
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {showNavTile && (
            <button
              type="button"
              onClick={onOpenPurchasing}
              className={`group mt-3 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[20rem] ${
                isUrgent
                  ? "border-red-300 bg-red-50/40 hover:border-red-400 hover:bg-red-50/60 focus-visible:ring-red-500"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/30 focus-visible:ring-brand-500"
              }`}
            >
              <div>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    isUrgent ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  {urgency.navEyebrow}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  Open Purchasing workspace
                </p>
              </div>
              <ArrowRightIcon
                className={`h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5 ${
                  isUrgent ? "group-hover:text-red-600" : "group-hover:text-brand-600"
                }`}
              />
            </button>
          )}

          {/* Tiny system-metadata line — the "this software is real
              and active" signal. Quiet, all-caps, wide letterspacing.
              Hardcoded ms value to avoid SSR/CSR hydration mismatch
              that Math.random() would introduce. */}
          <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
            Inventory validated in {VALIDATION_MS}ms · Logged just now
          </p>
        </div>
      </div>
    </div>
  );
}

function PurchasingWorkspace({
  rows,
  urgency,
  orderQty,
  onBack,
  onReset,
}: {
  rows: ComputedRow[];
  urgency: Urgency;
  orderQty: Qty;
  onBack: () => void;
  onReset: () => void;
}) {
  const items = rows
    .filter((r) => r.finalStatus !== "ok")
    .map((r) => {
      const qty = suggestedReorder(r.item, orderQty);
      return {
        name: r.item.name,
        unit: r.item.unit,
        qty,
        supplier: SUPPLIER_INFO[r.item.name]?.supplier ?? "—",
        coverage: coverageLabel(r.item, r.currentAfter, qty, orderQty),
      };
    });

  const noReplen = items.length === 0;

  return (
    <>
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
          <span className="font-mono text-slate-700">{ORDER.reference}</span>{" "}
          ({orderQty} × {PRODUCT.name}).
        </p>
      </div>

      {/* Suggestions table — desktop */}
      {!noReplen && (
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
      )}

      {/* Suggestions — mobile */}
      {!noReplen && (
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
      )}

      {/* If no replenishment needed (qty=25 path, if user navigates
          here anyway), show an "all clear" panel instead of an empty
          table. In practice the workspace-nav tile is hidden in that
          tier so this is mostly defensive. */}
      {noReplen && (
        <div className="px-5 py-6 text-center sm:px-6">
          <p className="text-sm font-semibold text-slate-900">
            No replenishment scheduled.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            All materials remain within healthy stock levels.
          </p>
        </div>
      )}

      {/* Operational insights — tier-adaptive */}
      <div
        className={`border-t border-slate-100 px-5 py-5 animate-fade-up sm:px-6 ${
          urgency.timingTone === "danger" ? "bg-red-50/40" : "bg-brand-50/20"
        }`}
        style={{ animationDelay: `${items.length * 90 + 60}ms` }}
      >
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5 text-slate-700">
            {urgency.timingTone === "danger" ? (
              <AlertIcon tone="danger" />
            ) : (
              <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
            )}
            <span>
              {urgency.timingTone === "danger" ? (
                <>
                  <span className="font-semibold text-red-800">
                    {urgency.timingLabel}
                  </span>
                  {" — production blocked until replenishment completes."}
                </>
              ) : (
                <>
                  Recommended reorder timing —{" "}
                  <span className="font-semibold text-slate-900">
                    {urgency.timingLabel.toLowerCase()}
                  </span>
                  .
                </>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-slate-700">
            {urgency.stabilityTone === "warn" ? (
              <AlertIcon tone="warn" />
            ) : (
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            )}
            <span>{urgency.stabilityLabel}</span>
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
