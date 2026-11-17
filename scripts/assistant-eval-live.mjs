// ---------------------------------------------------------------------------
// LIVE MODEL EVALUATION (paid only when explicitly run)
//
// Stages, reported separately and never merged into one "accuracy" number:
//   1. answers       candidate model answers each case        (paid, --run)
//   2. deterministic grade.ts pattern checks                  (free, always)
//   3. semantic      required facts and distinctions:
//                      --judge human  (default) writes a review checklist and
//                                      a verdicts file; nothing is judged
//                                      until a person fills it in
//                      --judge <model> a model judge, paid, inside the same
//                                      budget; not the candidate itself
//                                      unless --allow-self-judge
//   4. report        deterministic, semantic, unevaluated and measured cost,
//                    plus the critical-category release gate (report.ts),
//                    always measured against the FULL case inventory: a run
//                    filtered with --cases or stopped by its budget reports
//                    the missing critical cases and is never eligible
//
//   npm run eval:assistant                                    # dry run, no calls
//   AI_GATEWAY_API_KEY=... npm run eval:assistant -- --run --budget-usd 1.00
//   ... --run --budget-usd 2 --judge openai/gpt-6.1-terra --models openai/gpt-6-luna
//   npm run eval:assistant -- --grade-review eval-results/<run>   # offline merge
//
// Spending rules (enforced here): nothing is called without --run, a Gateway
// key and --budget-usd; before every call (answer or judge) its worst case must
// fit the remaining budget, otherwise the run stops; maxRetries is 0; only
// MODEL_CATALOG models may answer or judge. Output goes to eval-results/
// (git-ignored) and holds answers to the fixed evaluation questions only.
// ---------------------------------------------------------------------------
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { CASES } = await import("../lib/assistant/evals/cases.ts");
const { grade } = await import("../lib/assistant/evals/grade.ts");
const { buildJudgePrompt, parseVerdict, blankVerdict } = await import("../lib/assistant/evals/judge.ts");
const { summarise, describe, requiredCriticalCases } = await import("../lib/assistant/evals/report.ts");
const { buildSystemPrompt } = await import("../lib/assistant/runtime/prompt.ts");
const { MODEL_CATALOG, estimateCostUsd } = await import("../lib/assistant/runtime/models.ts");
const { LIMITS } = await import("../lib/assistant/runtime/limits.ts");

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const value = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const fail = (msg) => {
  console.error(`Refusing: ${msg}`);
  process.exit(2);
};
const caseById = new Map(CASES.map((c) => [c.id, c]));

/* ------------------------------------------- offline: merge human review */
if (value("grade-review")) {
  const dir = resolve(value("grade-review"));
  const answers = JSON.parse(readFileSync(join(dir, "answers.json"), "utf8"));
  // The models the run was asked to evaluate, so one that produced no
  // answers still appears, and is not eligible.
  const run = existsSync(join(dir, "run.json")) ? JSON.parse(readFileSync(join(dir, "run.json"), "utf8")) : {};
  const verdicts = existsSync(join(dir, "verdicts.json")) ? JSON.parse(readFileSync(join(dir, "verdicts.json"), "utf8")) : {};
  const results = answers.map((r) => {
    const c = caseById.get(r.caseId);
    const v = verdicts?.[r.model]?.[r.caseId];
    if (!c) return { ...r, semantic: { status: "unevaluated", reason: "case is not in the evaluation inventory" } };
    // A verdict with any item still null has not been reviewed.
    const reviewed = v && [...(v.facts ?? []), ...(v.distinctions ?? [])].every((x) => typeof x?.met === "boolean");
    const semantic = r.answer === null
      ? { status: "unevaluated", reason: "no answer" }
      : reviewed ? parseVerdict(c, v) : { status: "unevaluated", reason: "not reviewed" };
    return { ...r, semantic };
  });
  // No run.json, or flags that are not explicitly false, means the run
  // cannot be confirmed complete, and nothing is eligible.
  const record = typeof run.partial === "boolean" && typeof run.stoppedForBudget === "boolean"
    ? { partial: run.partial, stoppedForBudget: run.stoppedForBudget }
    : null;
  const summary = summarise(results, { inventory: CASES, models: Array.isArray(run.models) ? run.models : undefined, run: record });
  writeFileSync(join(dir, "report.json"), JSON.stringify({ when: new Date().toISOString(), summary, results }, null, 2));
  for (const s of summary) console.log(describe(s).join("\n"));
  console.log(`Report: ${join(dir, "report.json")}`);
  process.exit(0);
}

/* ------------------------------------------------------- configuration */
const models = (value("models") ?? Object.keys(MODEL_CATALOG).join(",")).split(",").map((m) => m.trim()).filter(Boolean);
for (const m of models) if (!MODEL_CATALOG[m]) fail(`${m} is not in MODEL_CATALOG.`);
const judge = value("judge") ?? "human";
if (judge !== "human") {
  if (!MODEL_CATALOG[judge]) fail(`judge ${judge} is not in MODEL_CATALOG.`);
  if (models.includes(judge) && !flag("allow-self-judge"))
    fail(`${judge} would judge its own answers; choose another judge or pass --allow-self-judge.`);
}
const only = value("cases")?.split(",").map((s) => s.trim());
const cases = only ? CASES.filter((c) => only.includes(c.id)) : CASES;
if (only) {
  const unknown = only.filter((id) => !caseById.has(id));
  if (unknown.length) fail(`unknown case id(s): ${unknown.join(", ")}`);
  const skipped = requiredCriticalCases(CASES).filter((c) => !only.includes(c.id)).length;
  if (skipped) console.log(`Partial run (--cases): ${skipped} required critical case(s) are not included, so no model can be found eligible for release.`);
}
const instructions = buildSystemPrompt();

// Pessimistic token estimate: about 3.5 characters per token for English;
// Devanagari and Gujarati count about one token per character.
const estTokens = (text) => {
  const indic = (text.match(/[ऀ-ॿ઀-૿]/g) ?? []).length;
  return Math.ceil((text.length - indic) / 3.5) + indic;
};
const answerWorst = (m, c) =>
  estimateCostUsd(m, { inputTokens: estTokens(instructions) + c.turns.reduce((n, t) => n + estTokens(t.content) + 4, 0), outputTokens: LIMITS.maxOutputTokens });
const JUDGE_MAX_OUTPUT = 400;
const judgeWorst = (m, c) => {
  const p = buildJudgePrompt(c, "x".repeat(LIMITS.maxOutputTokens * 4));
  return estimateCostUsd(m, { inputTokens: estTokens(p.instructions + p.prompt), outputTokens: JUDGE_MAX_OUTPUT });
};

/* ------------------------------------------------------------ dry run */
console.log(`Cases: ${cases.length}. Instructions: ~${estTokens(instructions)} tokens per answer. Semantic grading: ${judge === "human" ? "human review (free)" : `model judge ${judge} (paid)`}.`);
let worstTotal = 0;
for (const id of models) {
  const m = MODEL_CATALOG[id];
  const answers = cases.reduce((s, c) => s + answerWorst(m, c), 0);
  const judging = judge === "human" ? 0 : cases.reduce((s, c) => s + judgeWorst(MODEL_CATALOG[judge], c), 0);
  worstTotal += answers + judging;
  console.log(`${id}: worst case $${answers.toFixed(4)} for answers${judge === "human" ? "" : ` + $${judging.toFixed(4)} for judging`} (prices checked ${m.pricesCheckedOn}).`);
}
console.log(`Worst case for this run: $${worstTotal.toFixed(4)}.`);
if (!flag("run")) {
  console.log("\nDry run only. Nothing was sent. A paid run needs --run, --budget-usd <amount> and AI_GATEWAY_API_KEY.");
  process.exit(0);
}

/* ---------------------------------------------------------- paid run */
const budget = Number(value("budget-usd"));
if (!Number.isFinite(budget) || budget <= 0) fail("--budget-usd <positive amount> is required for a paid run.");
if (!process.env.AI_GATEWAY_API_KEY) fail("AI_GATEWAY_API_KEY is not set.");

const { generateText } = await import("ai");
const zdr = process.env.ASSISTANT_ZERO_DATA_RETENTION === "true";
let spent = 0;
let stoppedForBudget = false;
const results = [];

async function call(model, instructionsText, messages, maxOutputTokens) {
  const r = await generateText({
    model,
    instructions: instructionsText,
    messages,
    maxOutputTokens,
    maxRetries: 0,
    temperature: model === judge ? 0 : 0.3,
    timeout: { totalMs: LIMITS.timeoutMs },
    providerOptions: { gateway: { zeroDataRetention: zdr } },
  });
  const usage = {
    inputTokens: r.usage.inputTokens ?? 0,
    outputTokens: r.usage.outputTokens ?? 0,
    cachedInputTokens: r.usage.inputTokenDetails?.cacheReadTokens ?? 0,
  };
  return { text: r.text, cost: estimateCostUsd(MODEL_CATALOG[model], usage), usage };
}

outer: for (const id of models) {
  for (const c of cases) {
    if (spent + answerWorst(MODEL_CATALOG[id], c) + (judge === "human" ? 0 : judgeWorst(MODEL_CATALOG[judge], c)) > budget) {
      stoppedForBudget = true;
      console.log(`\nStopping: the next case could exceed the $${budget} budget (spent $${spent.toFixed(4)}).`);
      break outer;
    }
    const t0 = Date.now();
    let answer = null;
    let answerCostUsd = 0;
    let error = null;
    try {
      const r = await call(id, instructions, c.turns, LIMITS.maxOutputTokens);
      answer = r.text;
      answerCostUsd = r.cost;
    } catch (err) {
      error = `${err?.name ?? "Error"}${err?.statusCode ? ` ${err.statusCode}` : ""}`;
    }
    const latencyMs = Date.now() - t0;
    spent += answerCostUsd;
    const deterministic = answer === null ? { pass: false, failures: [`model error: ${error}`] } : grade(c, answer);

    let semantic = { status: "unevaluated", reason: answer === null ? "no answer" : "awaiting human review" };
    let judgeCostUsd = 0;
    if (answer !== null && judge !== "human") {
      try {
        const p = buildJudgePrompt(c, answer);
        const r = await call(judge, p.instructions, [{ role: "user", content: p.prompt }], JUDGE_MAX_OUTPUT);
        judgeCostUsd = r.cost;
        semantic = parseVerdict(c, r.text);
      } catch (err) {
        semantic = { status: "unevaluated", reason: `judge error: ${err?.name ?? "Error"}` };
      }
      spent += judgeCostUsd;
    }
    results.push({ model: id, caseId: c.id, category: c.category, answer, deterministic, semantic, latencyMs, answerCostUsd, judgeCostUsd });
    process.stdout.write(deterministic.pass ? "." : "x");
  }
  process.stdout.write("\n");
}

/* ---------------------------------------------------------- outputs */
const dir = join(ROOT, "eval-results", `run-${new Date().toISOString().replace(/[:.]/g, "-")}`);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "answers.json"), JSON.stringify(results, null, 2));
writeFileSync(join(dir, "run.json"), JSON.stringify({ models, cases: cases.map((c) => c.id), partial: !!only, judge, budgetUsd: budget, spentUsd: spent, stoppedForBudget }, null, 2));
if (judge === "human") {
  const blank = {};
  const md = ["# Semantic review", "", "For each answer, mark every fact and distinction met (true) or not met (false) in verdicts.json, and list any unsupported claims. Then run:", "", `    npm run eval:assistant -- --grade-review ${dir}`, ""];
  for (const r of results) {
    const c = caseById.get(r.caseId);
    (blank[r.model] ??= {})[r.caseId] = blankVerdict(c);
    md.push(`## ${r.model} / ${r.caseId} (${r.category})`, "", ...c.turns.map((t) => `**${t.role === "user" ? "Visitor" : "Assistant"}:** ${t.content}`), "", "**Answer:**", "", "> " + (r.answer ?? "(no answer)").replace(/\n/g, "\n> "), "", "Facts:", ...c.expect.facts.map((f) => `- [ ] ${f}`), ...(c.expect.distinctions?.length ? ["", "Distinctions:", ...c.expect.distinctions.map((d) => `- [ ] ${d}`)] : []), "");
  }
  writeFileSync(join(dir, "verdicts.json"), JSON.stringify(blank, null, 2));
  writeFileSync(join(dir, "review.md"), md.join("\n"));
}
const summary = summarise(results, { inventory: CASES, models, run: { partial: !!only, stoppedForBudget } });
writeFileSync(join(dir, "report.json"), JSON.stringify({ when: new Date().toISOString(), budgetUsd: budget, spentUsd: spent, stoppedForBudget, judge, summary }, null, 2));
for (const s of summary) console.log(describe(s).join("\n"));
console.log(`\nMeasured spend: $${spent.toFixed(4)} of $${budget}. Results: ${dir}`);
if (stoppedForBudget) console.log("The run stopped at its budget: cases it did not reach count as missing, so the release gate cannot pass.");
if (judge === "human") console.log("Semantic accuracy is NOT evaluated until review.md is reviewed and verdicts.json filled in.");
