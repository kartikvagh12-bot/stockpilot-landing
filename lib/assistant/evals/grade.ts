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

/** What a recognised denial is replaced with. Matches no forbidden pattern. */
export const DENIED = "[denied]";

/**
 * The answer as a forbidden pattern sees it: each of that pattern's listed
 * denials (types.ts `Denial`) is replaced by DENIED, and nothing else is
 * touched. There is no general negation rule: a denial is recognised only if
 * it is written into the case as an exact expression, so "no automatic Tally
 * sync, but Operza now synchronizes directly with TallyPrime" still fails on
 * its second half.
 */
export function withoutDenials(p: Pattern, text: string): string {
  let out = text;
  for (const d of p.denials ?? []) {
    const flags = d.flags ?? "i";
    out = out.replace(new RegExp(d.re, flags.includes("g") ? flags : `${flags}g`), DENIED);
  }
  return out;
}

/** True when the answer makes the forbidden claim. */
export const makesForbiddenClaim = (p: Pattern, text: string) => toRegExp(p).test(withoutDenials(p, text));

const SCRIPTS = {
  hi: /[ऀ-ॿ]/,
  gu: /[઀-૿]/,
} as const;

export function grade(c: EvalCase, answer: string): Grade {
  const failures: string[] = [];
  const e = c.expect;
  // Model replies often use typographic apostrophes. Normalizing only these
  // characters avoids false misses such as "I can’t" versus /can't/ without
  // changing the underlying forbidden-claim patterns or release gate.
  const checkedAnswer = answer.replace(/[\u2018\u2019\u02BC]/g, "'").replace(/\u00A0/g, " ");

  for (const p of e.mustNotInclude) {
    if (makesForbiddenClaim(p, checkedAnswer)) failures.push(`forbidden: /${p.re}/`);
  }
  for (const alternatives of e.mustInclude ?? []) {
    if (!alternatives.some((p) => toRegExp(p).test(checkedAnswer)))
      failures.push(`missing one of: ${alternatives.map((p) => `/${p.re}/`).join(" | ")}`);
  }
  if (e.clarify && !/[?？]/.test(checkedAnswer)) failures.push("expected a follow-up question");
  if (e.links?.length && !e.links.some((l) => checkedAnswer.includes(l)))
    failures.push(`expected a link to one of: ${e.links.join(", ")}`);
  if (e.language === "hi" && !SCRIPTS.hi.test(checkedAnswer)) failures.push("expected Hindi (Devanagari)");
  if (e.language === "gu" && !SCRIPTS.gu.test(checkedAnswer)) failures.push("expected Gujarati script");

  return { pass: failures.length === 0, failures };
}
