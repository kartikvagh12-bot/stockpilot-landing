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
 * What may follow a recognised denial. A denial is set aside only if nothing
 * after it can take it back. Three things can, and each is checked over the
 * rest of the denial's own sentence:
 *
 * 1. CONTRAST: "but", "however", "yet", "except", ... ("..., but it is").
 * 2. AFFIRMATION: "yes", "actually", "indeed", "in fact", "of course", ...
 *    ("..., and yes it is").
 * 3. REFERRING_CLAUSE: a pronoun (or "Operza", "there", "one", "you")
 *    followed by a positive auxiliary or "get", optionally with one word
 *    from INTENSIFIERS between ("it really is"), and with no negation right
 *    after it ("..., and it does", "..., there is one", "..., you get one").
 *    "It isn't", "it really isn't", "it is really not", "it can't" or
 *    "there's no" is negative and does not count.
 *
 * The next sentence can also take a denial back when it opens with an
 * affirmation or is nothing but a bare reaffirmation ("Yes it is.", "It
 * does.", "It really is.", "Actually, it can.", "But it is."). Any of these, and the denial is not
 * recognised: the text is checked as written. This is a closed, auditable
 * list, not a negation window; it only ever makes the grader stricter.
 */
export const CONTRAST_AFTER = /\b(?:but|however|though|although|yet|except|instead|unless|until)\b/i;
/** "yes", "in fact", ... always affirm. "actually", "indeed", "certainly",
 *  "definitely" and "absolutely" affirm unless a negation follows within the
 *  next word ("it definitely won't", "it actually isn't", "certainly not"). */
export const AFFIRMATION = /\b(?:yes|yeah|yep|yup|in fact|of course|true|correct)\b|\b(?:actually|indeed|certainly|definitely|absolutely)\b(?!\s+(?:\w+\s+)?(?:not|no|never)\b|\s+\w+n't\b|\s+\w+\s+\w+n't\b)/i;
const SUBJECT = "(?:it|they|this|that|these|those|which|one|there|you|we|Operza)";
/** One intensifying adverb that may sit between subject and verb ("it really
 *  is") or between verb and negation ("it is really not"). Closed list. */
export const INTENSIFIERS = ["really", "truly", "surely", "clearly", "definitely", "certainly", "indeed", "actually", "absolutely"] as const;
const INTENSIFIER = `(?:${INTENSIFIERS.join("|")})`;
const POSITIVE_AUX = `(?:'s|'re|'ll|'ve|'d|(?:\\s+${INTENSIFIER})?\\s+(?:is|are|was|were|does|do|did|can|could|will|would|has|have|had|gets?|offers?|includes?|supports?))`;
/** After the verb: a negation makes the clause negative ("it really isn't",
 *  "it is really not", "it can't"). */
const NEGATED = `(?:\\s*(?:${INTENSIFIER}\\s+)?(?:not|no|never)\\b|n't|'t)`;
export const REFERRING_CLAUSE = new RegExp(`\\b${SUBJECT}${POSITIVE_AUX}\\b(?!${NEGATED})`, "i");
const BARE_REAFFIRMATION = new RegExp(`^\\s*(?:(?:and|so)\\s+)?${SUBJECT}${POSITIVE_AUX}\\b(?!${NEGATED})(?:\\s+(?:too|indeed|now|already))?\\s*[.!]?\\s*$`, "i");

/** True when the text after a denial can take it back (see above). */
export function takesDenialBack(after: string): boolean {
  const sentence = /^[^.;!?\n]*/.exec(after)?.[0] ?? "";
  if (CONTRAST_AFTER.test(sentence) || AFFIRMATION.test(sentence) || REFERRING_CLAUSE.test(sentence)) return true;
  const next = /^[.;!?\n]+\s*([^.;!?\n]*[.;!?]?)/.exec(after.slice(sentence.length))?.[1] ?? "";
  // A next sentence that is a contrast word plus a bare reaffirmation ("But
  // it is.", "However it is.", "Yet it does.") also takes the denial back.
  const afterContrast = next.replace(new RegExp(`^\\s*${CONTRAST_AFTER.source},?\\s+`, "i"), "");
  return /^\s*(?:yes|yeah|yep|actually|indeed|in fact|of course|certainly|definitely|absolutely|true)\b/i.test(next) || BARE_REAFFIRMATION.test(next)
    || (afterContrast !== next && BARE_REAFFIRMATION.test(afterContrast));
}

/**
 * The answer as a forbidden pattern sees it: each of that pattern's listed
 * denials (types.ts `Denial`) is replaced by DENIED, and nothing else is
 * touched. There is no general negation rule: a denial is recognised only if
 * it is written into the case as an exact expression, so "no automatic Tally
 * sync, but Operza now synchronizes directly with TallyPrime" still fails on
 * its second half. A denial that what follows takes back (takesDenialBack)
 * is not recognised at all, so "I can't say whether Operza is cheaper, and
 * yes it is" fails even though its second half names no claim.
 */
export function withoutDenials(p: Pattern, text: string): string {
  let out = text;
  for (const d of p.denials ?? []) {
    const flags = d.flags ?? "i";
    out = out.replace(new RegExp(d.re, flags.includes("g") ? flags : `${flags}g`), (match: string, ...rest: unknown[]) => {
      const offset = rest.find((x): x is number => typeof x === "number") ?? 0;
      return takesDenialBack(out.slice(offset + match.length)) ? match : DENIED;
    });
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
