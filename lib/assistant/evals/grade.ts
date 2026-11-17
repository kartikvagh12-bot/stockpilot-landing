import type { EvalCase, Pattern } from "@/lib/assistant/types";

// The deterministic grader. Given an evaluation case and an answer, it checks
// what can be checked without a model: forbidden claims absent, required
// points present, a follow-up question asked when one is required, a valid
// link given, and the right script used.
//
// It is deliberately a floor, not a ceiling. A live-model evaluation (a later
// PR) runs these checks first and then asks a judge about `expect.facts` and
// `expect.distinctions`, which a regular expression cannot judge fairly.

export type Grade = { pass: boolean; failures: string[] };

export const toRegExp = (p: Pattern) => new RegExp(p.re, p.flags ?? "i");

const SCRIPTS = {
  hi: /[ऀ-ॿ]/,
  gu: /[઀-૿]/,
} as const;

export function grade(c: EvalCase, answer: string): Grade {
  const failures: string[] = [];
  const e = c.expect;

  for (const p of e.mustNotInclude) {
    if (toRegExp(p).test(answer)) failures.push(`forbidden: /${p.re}/`);
  }
  for (const alternatives of e.mustInclude ?? []) {
    if (!alternatives.some((p) => toRegExp(p).test(answer)))
      failures.push(`missing one of: ${alternatives.map((p) => `/${p.re}/`).join(" | ")}`);
  }
  if (e.clarify && !/[?？]/.test(answer)) failures.push("expected a follow-up question");
  if (e.links?.length && !e.links.some((l) => answer.includes(l)))
    failures.push(`expected a link to one of: ${e.links.join(", ")}`);
  if (e.language === "hi" && !SCRIPTS.hi.test(answer)) failures.push("expected Hindi (Devanagari)");
  if (e.language === "gu" && !SCRIPTS.gu.test(answer)) failures.push("expected Gujarati script");

  return { pass: failures.length === 0, failures };
}
