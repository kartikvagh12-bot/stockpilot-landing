// ---------------------------------------------------------------------------
// LIVE MODEL EVALUATION (paid only when explicitly run)
//
// Runs the 67 evaluation cases from lib/assistant/evals/cases.ts against the
// candidate models through AI Gateway, with exactly the instructions the
// endpoint serves (buildSystemPrompt), grades each answer with the same
// deterministic grader, and reports accuracy by category, latency and cost.
//
//   npm run eval:assistant                       # dry run: estimate only, no calls
//   AI_GATEWAY_API_KEY=... npm run eval:assistant -- --run --budget-usd 1.00
//   ... --models openai/gpt-6-luna --cases pricing-how-much,gst-einvoice
//
// Spending rules (enforced here, not just documented):
//   - Nothing is called without --run, a Gateway key and --budget-usd.
//   - Before every call, the worst case (full input + maximum output) must fit
//     the remaining budget; otherwise the run stops.
//   - maxRetries is 0, so a failure is never silently paid twice.
//   - Only models in MODEL_CATALOG may be evaluated.
// Results are written to eval-results/ (git-ignored) and contain model
// answers to the fixed evaluation questions only: no visitor data.
// ---------------------------------------------------------------------------
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { CASES } = await import("../lib/assistant/evals/cases.ts");
const { grade } = await import("../lib/assistant/evals/grade.ts");
const { buildSystemPrompt } = await import("../lib/assistant/runtime/prompt.ts");
const { MODEL_CATALOG, estimateCostUsd } = await import("../lib/assistant/runtime/models.ts");
const { LIMITS } = await import("../lib/assistant/runtime/limits.ts");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const models = (value("models") ?? Object.keys(MODEL_CATALOG).join(",")).split(",").map((m) => m.trim()).filter(Boolean);
for (const m of models) {
  if (!MODEL_CATALOG[m]) {
    console.error(`Refusing: ${m} is not in MODEL_CATALOG.`);
    process.exit(2);
  }
}
const only = value("cases")?.split(",").map((s) => s.trim());
const cases = only ? CASES.filter((c) => only.includes(c.id)) : CASES;
const instructions = buildSystemPrompt();

// A deliberately pessimistic token estimate (about 3.5 characters per token
// for English, and Devanagari or Gujarati count as roughly one token each).
const estTokens = (text) => {
  const indic = (text.match(/[ऀ-ॿ઀-૿]/g) ?? []).length;
  return Math.ceil((text.length - indic) / 3.5) + indic;
};
const inputEstimate = (c) => estTokens(instructions) + c.turns.reduce((n, t) => n + estTokens(t.content) + 4, 0);

/* ------------------------------------------------------------ dry run */
const worst = (model, c) => estimateCostUsd(model, { inputTokens: inputEstimate(c), outputTokens: LIMITS.maxOutputTokens });
const typical = (model, c) => estimateCostUsd(model, { inputTokens: inputEstimate(c), outputTokens: 250 });
console.log(`Cases: ${cases.length}. Instructions: ~${estTokens(instructions)} tokens per call.`);
for (const id of models) {
  const m = MODEL_CATALOG[id];
  const w = cases.reduce((s, c) => s + worst(m, c), 0);
  const t = cases.reduce((s, c) => s + typical(m, c), 0);
  console.log(
    `${id}: estimated $${t.toFixed(4)} typical, $${w.toFixed(4)} worst case for one pass ` +
      `(prices checked ${m.pricesCheckedOn}; prompt caching would lower input cost).`,
  );
}

if (!flag("run")) {
  console.log("\nDry run only. Nothing was sent. Add --run --budget-usd <amount> with AI_GATEWAY_API_KEY set to evaluate.");
  process.exit(0);
}

/* ---------------------------------------------------------- paid run */
const budget = Number(value("budget-usd"));
if (!Number.isFinite(budget) || budget <= 0) {
  console.error("Refusing: --budget-usd <positive amount> is required for a paid run.");
  process.exit(2);
}
if (!process.env.AI_GATEWAY_API_KEY) {
  console.error("Refusing: AI_GATEWAY_API_KEY is not set.");
  process.exit(2);
}

const { generateText } = await import("ai");
let spent = 0;
const results = [];
let stoppedForBudget = false;

outer: for (const id of models) {
  const m = MODEL_CATALOG[id];
  for (const c of cases) {
    if (spent + worst(m, c) > budget) {
      stoppedForBudget = true;
      console.log(`Stopping: the next call could exceed the $${budget} budget (spent $${spent.toFixed(4)}).`);
      break outer;
    }
    const t0 = Date.now();
    let answer = "";
    let usage = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 };
    let error = null;
    try {
      const r = await generateText({
        model: id,
        instructions,
        messages: c.turns,
        maxOutputTokens: LIMITS.maxOutputTokens,
        maxRetries: 0,
        temperature: 0.3,
        timeout: { totalMs: LIMITS.timeoutMs },
        providerOptions: { gateway: { zeroDataRetention: process.env.ASSISTANT_ZERO_DATA_RETENTION === "true" } },
      });
      answer = r.text;
      usage = {
        inputTokens: r.usage.inputTokens ?? 0,
        outputTokens: r.usage.outputTokens ?? 0,
        cachedInputTokens: r.usage.inputTokenDetails?.cacheReadTokens ?? 0,
      };
    } catch (err) {
      error = `${err?.name ?? "Error"}${err?.statusCode ? ` ${err.statusCode}` : ""}`;
    }
    const ms = Date.now() - t0;
    const cost = estimateCostUsd(m, usage);
    spent += cost;
    const g = error ? { pass: false, failures: [`error: ${error}`] } : grade(c, answer);
    results.push({ model: id, case: c.id, category: c.category, pass: g.pass, failures: g.failures, ms, usage, cost, answer });
    process.stdout.write(g.pass ? "." : "x");
  }
  process.stdout.write("\n");
}

/* ---------------------------------------------------------- report */
const summary = {};
for (const id of models) {
  const rs = results.filter((r) => r.model === id);
  if (!rs.length) continue;
  const byCat = {};
  for (const r of rs) {
    byCat[r.category] ??= { pass: 0, total: 0 };
    byCat[r.category].total++;
    if (r.pass) byCat[r.category].pass++;
  }
  const lat = rs.map((r) => r.ms).sort((a, b) => a - b);
  summary[id] = {
    cases: rs.length,
    passed: rs.filter((r) => r.pass).length,
    byCategory: byCat,
    latencyMs: { median: lat[Math.floor(lat.length / 2)], p95: lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] },
    tokens: rs.reduce((a, r) => ({ input: a.input + r.usage.inputTokens, output: a.output + r.usage.outputTokens }), { input: 0, output: 0 }),
    costUsd: rs.reduce((s, r) => s + r.cost, 0),
    costPerConversationUsd: rs.reduce((s, r) => s + r.cost, 0) / rs.length,
  };
}
const out = join(ROOT, "eval-results");
mkdirSync(out, { recursive: true });
const file = join(out, `eval-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(file, JSON.stringify({ when: new Date().toISOString(), budgetUsd: budget, spentUsd: spent, stoppedForBudget, summary, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log(`Spent about $${spent.toFixed(4)} of $${budget}. Full results: ${file}`);
