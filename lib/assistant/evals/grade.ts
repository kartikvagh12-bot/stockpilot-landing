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

/**
 * For explicitly opted-in patterns, a matched phrase is not an affirmative
 * claim if it is narrowly denied in the same clause. This fixes false alarms
 * such as "no live sync" or "can't confirm a discount" while retaining
 * detection of the same claim when asserted.
 *
 * Not a semantic judge: uncertain cases still fail closed. In particular,
 * a quoted or hedged numerical price is NEVER accepted.
 */
function explicitlyDenied(answer: string, start: number, matched: string): boolean {
  // Even a statement that an exact price isn't confirmed discloses a figure.
  if (/₹\s*\d|\b(?:Rs\.?|INR)\s*\d|\$\s*\d|\b\d[\d,]*\s*(?:rupees|\/month|per month|a month|per user|per year)/i.test(matched))
    return false;

  const before = answer.slice(Math.max(0, start - 160), start);
  // A denial doesn't carry across full stops or contrary claims introduced
  // by "but", "however" or a new ", and ..." clause. Comma + "or" remains
  // in scope for a coordinated negative list of GST operations.
  const clause = before.split(/(?:[.!?;\n]\s*|\b(?:but|however|though|yet|instead|nevertheless|actually)\b\s*|,\s*and\s+)/i).at(-1) ?? "";
  const negations = [...clause.matchAll(/\b(?:not|no|never|without|cannot|can't|won't|isn't|aren't|wasn't|weren't|doesn't|don't|didn't|wouldn't|couldn't)\b/gi)];
  const last = negations.at(-1);
  if (last && last.index !== undefined) {
    const scope = clause.slice(last.index + last[0].length);
    // Coordinated lists can span further than a one-term denial.
    if ((scope.length <= 75 || (scope.length <= 140 && /\bor\b/i.test(scope))) &&
        !/^\s*(?:deny|rule out)\b/i.test(scope)) return true;
  }

  // The subject can precede its denial: "A free trial isn't confirmed."
  const after = answer.slice(start + matched.length, start + matched.length + 45);
  return /^\s+(?:(?:is|are|has|have|was|were)\s+)?(?:not|never|unconfirmed|unknown|isn't|aren't|wasn't|weren't)\b/i.test(after);
}

/** No blanket relaxation: only patterns marked negationAware use this. */
function forbiddenAssertionPresent(pattern: Pattern, answer: string): boolean {
  if (!pattern.negationAware) return toRegExp(pattern).test(answer);
  const flags = pattern.flags ?? "i";
  const global = new RegExp(pattern.re, flags.includes("g") ? flags : flags + "g");
  return [...answer.matchAll(global)].some((m) =>
    !explicitlyDenied(answer, m.index ?? 0, m[0]));
}


export function grade(c: EvalCase, answer: string): Grade {
  const failures: string[] = [];
  const e = c.expect;
  // Model replies often use typographic apostrophes. Normalizing only these
  // characters avoids false misses such as "I can’t" versus /can't/ without
  // changing the underlying forbidden-claim patterns or release gate.
  const checkedAnswer = answer.replace(/[\u2018\u2019\u02BC]/g, "'").replace(/\u00A0/g, " ");

  for (const p of e.mustNotInclude) {
    if (forbiddenAssertionPresent(p, checkedAnswer)) failures.push(`forbidden: /${p.re}/`);
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
