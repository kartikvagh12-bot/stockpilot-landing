import type { EvalCategory } from "@/lib/assistant/types";
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
// categories passes BOTH stages, with none left unevaluated.

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

export type ModelSummary = {
  model: string;
  cases: number;
  deterministic: { pass: number; total: number };
  semantic: Tally;
  byCategory: Record<string, { deterministicPass: number; semantic: Tally; total: number }>;
  critical: { eligible: boolean; blockers: string[] };
  latencyMs: { median: number; p95: number } | null;
  measuredCostUsd: { answers: number; judging: number };
};

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

export function summarise(results: CaseResult[]): ModelSummary[] {
  const models = [...new Set(results.map((r) => r.model))];
  return models.map((model) => {
    const rs = results.filter((r) => r.model === model);
    const semantic: Tally = { pass: 0, fail: 0, unevaluated: 0, total: rs.length };
    const byCategory: ModelSummary["byCategory"] = {};
    const blockers: string[] = [];
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
      if (CRITICAL_CATEGORIES.includes(r.category)) {
        if (!r.deterministic.pass) blockers.push(`${r.caseId}: deterministic check failed`);
        if (r.semantic.status === "fail") blockers.push(`${r.caseId}: semantic check failed`);
        if (r.semantic.status === "unevaluated") blockers.push(`${r.caseId}: not semantically evaluated`);
      }
    }
    for (const cat of CRITICAL_CATEGORIES)
      if (!rs.some((r) => r.category === cat)) blockers.push(`${cat}: no cases were run`);
    const lat = rs.filter((r) => r.answer !== null).map((r) => r.latencyMs).sort((a, b) => a - b);
    return {
      model,
      cases: rs.length,
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
    `  Critical categories (${CRITICAL_CATEGORIES.join(", ")}): ${s.critical.eligible ? "eligible" : `NOT eligible (${s.critical.blockers.length} blockers)`}`,
    `  Measured cost: answers $${s.measuredCostUsd.answers.toFixed(4)}, judging $${s.measuredCostUsd.judging.toFixed(4)}`,
    s.latencyMs ? `  Latency: median ${s.latencyMs.median} ms, p95 ${s.latencyMs.p95} ms` : "  Latency: no answers",
  ];
}
