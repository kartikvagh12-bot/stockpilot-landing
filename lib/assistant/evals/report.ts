import type { EvalCase, EvalCategory } from "@/lib/assistant/types";
import type { SemanticResult } from "@/lib/assistant/evals/judge";

// Summarises an evaluation run while keeping four things apart:
//   deterministic  pattern checks (forbidden claims, required keywords, links,
//                  script); a floor, never "accuracy"
//   semantic       whether required facts and distinctions were conveyed, as
//                  judged by a human reviewer or a model judge
//   unevaluated    answers with no valid semantic verdict yet
//   cost           measured from actual token usage, answers and judging apart
//
// A model is eligible for release only if every case in the critical
// categories passes BOTH stages, with none left unevaluated. "Every case" is
// measured against the full evaluation inventory (CASES), never against the
// results supplied: each required critical case must appear exactly once for
// the model, so a run filtered with --cases, a run stopped by its budget, a
// model that produced no results at all, or a results file with a case
// missing or repeated can never be reported as eligible. The category used
// for the gate comes from the inventory, not from the result row.
//
// The run itself must also be complete: a run filtered with --cases or
// stopped by its budget is never eligible, even if every critical case it
// reached passed, and a run whose completeness is unknown (no run record)
// is treated the same way.

export const CRITICAL_CATEGORIES: readonly EvalCategory[] = [
  "pricing",
  "prompt-injection",
  "data-access",
  "gst",
  "tally",
  "linspace",
];

export type CaseResult = {
  model: string;
  caseId: string;
  category: EvalCategory;
  /** null when the model call itself failed. */
  answer: string | null;
  deterministic: { pass: boolean; failures: string[] };
  semantic: SemanticResult;
  latencyMs: number;
  answerCostUsd: number;
  judgeCostUsd: number;
};

type Tally = { pass: number; fail: number; unevaluated: number; total: number };

/** How the run went, from run.json. null when there is no record. */
export type RunRecord = { partial: boolean; stoppedForBudget: boolean } | null;

export type ModelSummary = {
  model: string;
  cases: number;
  /** Required critical cases from the inventory, and how many were run once. */
  criticalCoverage: { required: number; runOnce: number; missing: string[]; duplicated: string[] };
  deterministic: { pass: number; total: number };
  semantic: Tally;
  byCategory: Record<string, { deterministicPass: number; semantic: Tally; total: number }>;
  critical: { eligible: boolean; blockers: string[] };
  latencyMs: { median: number; p95: number } | null;
  measuredCostUsd: { answers: number; judging: number };
};

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

/** The critical cases every candidate must be evaluated on. */
export function requiredCriticalCases(inventory: readonly EvalCase[]): EvalCase[] {
  return inventory.filter((c) => CRITICAL_CATEGORIES.includes(c.category));
}

export function summarise(
  results: CaseResult[],
  options: {
    /** The full evaluation inventory (CASES), never a filtered subset. */
    inventory: readonly EvalCase[];
    /** Every model the run was asked to evaluate, including any that
     *  produced no results (for example, stopped by the budget). */
    models?: readonly string[];
    /** Whether the run was complete. Required, so no caller can skip it. */
    run: RunRecord;
  },
): ModelSummary[] {
  const required = requiredCriticalCases(options.inventory);
  if (required.length === 0) throw new Error("summarise: the inventory has no critical cases; pass the full CASES list.");
  const categoryOf = new Map(options.inventory.map((c) => [c.id, c.category]));
  const models = [...new Set([...(options.models ?? []), ...results.map((r) => r.model)])];
  const runBlockers: string[] = [];
  if (!options.run) runBlockers.push("run: no run record, so completeness cannot be confirmed");
  else {
    if (options.run.partial !== false) runBlockers.push("run: partial (filtered with --cases), not a full evaluation");
    if (options.run.stoppedForBudget !== false) runBlockers.push("run: stopped at its budget before finishing");
  }
  return models.map((model) => {
    const rs = results.filter((r) => r.model === model);
    const semantic: Tally = { pass: 0, fail: 0, unevaluated: 0, total: rs.length };
    const byCategory: ModelSummary["byCategory"] = {};
    const blockers: string[] = [...runBlockers];
    for (const r of rs) {
      semantic[r.semantic.status === "unevaluated" ? "unevaluated" : r.semantic.status]++;
      const c = (byCategory[r.category] ??= {
        deterministicPass: 0,
        semantic: { pass: 0, fail: 0, unevaluated: 0, total: 0 },
        total: 0,
      });
      c.total++;
      c.semantic.total++;
      if (r.deterministic.pass) c.deterministicPass++;
      c.semantic[r.semantic.status === "unevaluated" ? "unevaluated" : r.semantic.status]++;
      const category = categoryOf.get(r.caseId);
      if (category === undefined) blockers.push(`${r.caseId}: not in the evaluation inventory`);
      else if (category !== r.category) blockers.push(`${r.caseId}: reported as ${r.category}, inventory says ${category}`);
      if (category !== undefined && CRITICAL_CATEGORIES.includes(category)) {
        if (!r.deterministic.pass) blockers.push(`${r.caseId}: deterministic check failed`);
        if (r.semantic.status === "fail") blockers.push(`${r.caseId}: semantic check failed`);
        if (r.semantic.status === "unevaluated") blockers.push(`${r.caseId}: not semantically evaluated`);
      }
    }
    const missing: string[] = [];
    const duplicated: string[] = [];
    for (const c of required) {
      const n = rs.filter((r) => r.caseId === c.id).length;
      if (n === 0) missing.push(c.id);
      if (n > 1) duplicated.push(c.id);
    }
    for (const id of missing) blockers.push(`${id}: required critical case was not run`);
    for (const id of duplicated) blockers.push(`${id}: appears more than once`);
    const lat = rs.filter((r) => r.answer !== null).map((r) => r.latencyMs).sort((a, b) => a - b);
    return {
      model,
      cases: rs.length,
      criticalCoverage: {
        required: required.length,
        runOnce: required.length - missing.length - duplicated.length,
        missing,
        duplicated,
      },
      deterministic: { pass: rs.filter((r) => r.deterministic.pass).length, total: rs.length },
      semantic,
      byCategory,
      critical: { eligible: blockers.length === 0, blockers },
      latencyMs: lat.length ? { median: pct(lat, 0.5), p95: pct(lat, 0.95) } : null,
      measuredCostUsd: {
        answers: rs.reduce((s, r) => s + r.answerCostUsd, 0),
        judging: rs.reduce((s, r) => s + r.judgeCostUsd, 0),
      },
    };
  });
}

/** Plain-language lines, so a report can never present the pattern pass rate
 *  as accuracy. */
export function describe(s: ModelSummary): string[] {
  return [
    `${s.model}: ${s.cases} cases`,
    `  Deterministic checks (patterns only, not accuracy): ${s.deterministic.pass}/${s.deterministic.total} passed`,
    `  Semantic accuracy (facts and distinctions): ${s.semantic.pass} passed, ${s.semantic.fail} failed, ${s.semantic.unevaluated} not yet evaluated`,
    `  Critical cases run exactly once: ${s.criticalCoverage.runOnce}/${s.criticalCoverage.required}${s.criticalCoverage.missing.length ? ` (${s.criticalCoverage.missing.length} missing)` : ""}${s.criticalCoverage.duplicated.length ? ` (${s.criticalCoverage.duplicated.length} duplicated)` : ""}`,
    `  Release gate, critical categories (${CRITICAL_CATEGORIES.join(", ")}): ${s.critical.eligible ? "eligible" : `NOT eligible (${s.critical.blockers.length} blockers)`}`,
    `  Measured cost: answers $${s.measuredCostUsd.answers.toFixed(4)}, judging $${s.measuredCostUsd.judging.toFixed(4)}`,
    s.latencyMs ? `  Latency: median ${s.latencyMs.median} ms, p95 ${s.latencyMs.p95} ms` : "  Latency: no answers",
  ];
}
