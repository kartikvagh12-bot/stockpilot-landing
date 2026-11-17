// ---------------------------------------------------------------------------
// ASSISTANT KNOWLEDGE AND EVALUATION GUARD (offline, deterministic)
//
// Checks the knowledge base, the behaviour spec and the evaluation dataset
// for the future operza.in assistant. It never calls a model, never touches
// the network, and needs no credentials:
//
//   npm run test:assistant
//
// What it cannot do offline is re-read operza-app; that is
// `npm run verify:assistant-sources` (needs OPERZA_APP_DIR). Live-model
// evaluation is a later PR and is deliberately absent here.
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const squash = (t) => t.replace(/\s+/g, " ");

const { KNOWLEDGE, REQUIRED_LIMITATIONS } = await import("../lib/assistant/knowledge.ts");
const { PRODUCT_SOURCE } = await import("../lib/assistant/sources.ts");
const { DESTINATIONS, CONTACT } = await import("../lib/assistant/destinations.ts");
const { RULES, systemInstructions } = await import("../lib/assistant/instructions.ts");
const { CASES } = await import("../lib/assistant/evals/cases.ts");
const { grade, toRegExp } = await import("../lib/assistant/evals/grade.ts");
const { SITE } = await import("../lib/site.ts");

let checks = 0;
let failures = 0;
const ok = (label, cond, detail = "") => {
  checks++;
  if (!cond) failures++;
  if (!cond || process.env.VERBOSE) console.log(`  ${cond ? "✓" : "✗"} ${label}${!cond && detail ? `\n      ${detail}` : ""}`);
};
const section = (t) => console.log(`\n---- ${t} ----`);
const list = (xs) => xs.slice(0, 6).join("\n      ");

/* ========================================================================= */
section("A. ONE PINNED SOURCE OF PRODUCT TRUTH");
/* ========================================================================= */
ok("(A1) the pinned operza-app commit is a full SHA", /^[0-9a-f]{40}$/.test(PRODUCT_SOURCE.commit));
ok("(A2) ...and it is the commit CLAUDE.md records as last verified",
   read("CLAUDE.md").includes(PRODUCT_SOURCE.commit));
ok("(A3) ...with a verification date", /^\d{4}-\d{2}-\d{2}$/.test(PRODUCT_SOURCE.verifiedOn));

/* ========================================================================= */
section("B. EVERY ENTRY IS WELL FORMED AND HONESTLY LABELLED");
/* ========================================================================= */
const KINDS = ["product-fact", "limitation", "marketing-copy", "policy", "unknown"];
const ids = KNOWLEDGE.map((e) => e.id);
ok(`(B1) entries exist (${KNOWLEDGE.length})`, KNOWLEDGE.length >= 40);
ok("(B2) ids are unique", new Set(ids).size === ids.length,
   ids.filter((x, i) => ids.indexOf(x) !== i).join(", "));
const malformed = KNOWLEDGE.filter((e) =>
  !/^[a-z0-9-]+$/.test(e.id) || !KINDS.includes(e.kind) || !e.statement?.trim()
  || !e.appliesTo?.length || !Array.isArray(e.sources));
ok("(B3) every entry has an id, a kind, an audience and a statement", malformed.length === 0,
   malformed.map((e) => e.id).join(", "));
// A product claim must be traceable to the product, not to this website.
const productLike = KNOWLEDGE.filter((e) => e.kind === "product-fact" || e.kind === "limitation");
const untraced = productLike.filter((e) => !e.sources.some((s) => s.repo === "operza-app"));
ok(`(B4) every product-fact and limitation cites operza-app (${productLike.length})`,
   untraced.length === 0, untraced.map((e) => e.id).join(", "));
const copyOnly = KNOWLEDGE.filter((e) => e.kind === "marketing-copy");
ok("(B5) marketing copy cites the site page that renders it",
   copyOnly.every((e) => e.sources.some((s) => s.repo === "stockpilot-landing")),
   copyOnly.filter((e) => !e.sources.some((s) => s.repo === "stockpilot-landing")).map((e) => e.id).join(", "));
ok("(B6) ...and never cites operza-app as if copy were a capability",
   copyOnly.every((e) => !e.sources.some((s) => s.repo === "operza-app")));
const policies = KNOWLEDGE.filter((e) => e.kind === "policy");
ok("(B7) every policy cites a decision or site file",
   policies.every((e) => e.sources.some((s) => s.repo !== "operza-app")));
const unknowns = KNOWLEDGE.filter((e) => e.kind === "unknown");
ok(`(B8) every unknown routes to a person (${unknowns.length})`,
   unknowns.length >= 5 && unknowns.every((e) => e.confirmWithHuman === true),
   unknowns.filter((e) => !e.confirmWithHuman).map((e) => e.id).join(", "));
const anchors = KNOWLEDGE.flatMap((e) => e.sources.map((s) => ({ e, s })));
ok("(B9) every citation has a path and an anchor of real length",
   anchors.every(({ s }) => s.path && s.anchor && s.anchor.trim().length >= 8),
   anchors.filter(({ s }) => !(s.anchor?.trim().length >= 8)).map(({ e }) => e.id).join(", "));

/* ========================================================================= */
section("C. LOCAL CITATIONS RESOLVE");
/* ========================================================================= */
{
  // operza-app citations are checked by verify-assistant-sources against the
  // pinned commit. Citations into this repository are checked here, every run.
  const local = anchors.filter(({ s }) => s.repo !== "operza-app");
  const broken = local.filter(({ s }) => {
    const f = join(ROOT, s.path.split("#")[0]);
    return !existsSync(f) || !squash(readFileSync(f, "utf8")).includes(squash(s.anchor));
  });
  ok(`(C1) every citation into this repository is found verbatim (${local.length})`,
     broken.length === 0, list(broken.map(({ e, s }) => `${e.id}: ${s.path} "${s.anchor}"`)));
}

/* ========================================================================= */
section("D. THE KNOWLEDGE COVERS WHAT VISITORS ASK");
/* ========================================================================= */
{
  const TOPICS = ["company", "products", "plans", "plan-boundaries", "materials-stock",
    "bom-production", "packing-dispatch", "costing", "accounting", "bank", "tally", "gst",
    "users-access", "setup-import", "devices", "corrections", "plan-changes", "linspace",
    "contact", "pricing", "languages", "security", "health-check"];
  const missing = TOPICS.filter((t) => !KNOWLEDGE.some((e) => e.topic === t));
  ok("(D1) every required topic has at least one entry", missing.length === 0, missing.join(", "));
  const lack = REQUIRED_LIMITATIONS.filter((id) => !ids.includes(id));
  ok(`(D2) the limitations visitors must hear are all present (${REQUIRED_LIMITATIONS.length})`,
     lack.length === 0, lack.join(", "));
  for (const plan of ["factory", "books", "complete"])
    ok(`(D3-${plan}) the ${plan} plan has its own facts and its own restriction`,
       KNOWLEDGE.some((e) => e.appliesTo.includes(plan) && e.kind === "product-fact")
       && KNOWLEDGE.some((e) => e.appliesTo.includes(plan) && e.kind === "limitation"));
  ok("(D4) Linspace is described only as policy, copy, limitation or unknown, never as a product fact",
     KNOWLEDGE.filter((e) => e.appliesTo.includes("linspace")).every((e) => e.kind !== "product-fact"));
}

/* ========================================================================= */
section("E. STATEMENTS ARE SAFE TO SAY IN PUBLIC");
/* ========================================================================= */
{
  const s = KNOWLEDGE.map((e) => ({ id: e.id, t: e.statement }));
  const hit = (re) => s.filter(({ t }) => re.test(t)).map(({ id, t }) => `${id}: ${t.slice(0, 90)}`);
  const RULES_ = [
    ["no em dash", /—/],
    ["no retired vocabulary", /\bparts?\b(?! of)|raw materials?|\bFG\b|\bWAC\b|cost intelligence|\bsuites?\b|\bslugs?\b/i],
    ["no database vocabulary", /\b(database|RPC|migration|SQL|schema|rollback|transactions?|supabase|postgres|table)\b/i],
    ["never calls the customer small", /\bsmall(er)?[\s-]+(manufactur|factor|business|firm|compan)/i],
    ["no secret-shaped strings", /\b(sk-[a-z0-9]|api[_-]?key|password\s*[:=]|eyJ[a-zA-Z0-9]{10,}|service[_-]role|BEGIN [A-Z ]*PRIVATE KEY)/i],
    ["no internal identifiers", /\bTALLY_AUTO_ENQUEUE\b|\bintegration_bridge\b|\bgst_compliance\b|\bADR-\d+|\bkragnxms/i],
    ["no invented figures", /₹\s?\d|\bRs\.?\s?\d|\$\s?\d|\bper (month|user|seat)\b|\d+\s*%/i],
  ];
  for (const [name, re] of RULES_) {
    const h = hit(re);
    ok(`(E-${name})`, h.length === 0, list(h));
  }
  // The only contact details and URLs the assistant may give out.
  const allowed = new Set([CONTACT.email, CONTACT.whatsapp, CONTACT.app]);
  const emails = s.flatMap(({ t }) => t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []);
  ok("(E-only the public email)", emails.every((m) => allowed.has(m)), emails.join(", "));
  const urls = s.flatMap(({ t }) => t.match(/https?:\/\/[^\s)]+/g) ?? []);
  ok("(E-only the app URL)", urls.every((u) => u.replace(/[.,]$/, "") === CONTACT.app), urls.join(", "));
  // Linspace is in development: no statement may say it does anything today.
  const linspaceClaims = KNOWLEDGE.filter((e) => e.appliesTo.includes("linspace") || /Linspace/.test(e.statement))
    .filter((e) => /Linspace\b[^.]*\b(?:already|now|today|currently)\s+(?:reads|measures|generates|produces|creates|calculates|supports|offers|does)|Linspace\s+(?:reads|measures|generates|produces|creates|calculates|automates|extracts)\b|\b(?:it|Linspace)\s+(?:already|now)\s+\w+s\b/i.test(e.statement));
  ok("(E-Linspace claims nothing it does today)", linspaceClaims.length === 0, linspaceClaims.map((e) => e.id).join(", "));
  const legal = s.filter(({ t }) => t.includes(SITE.legalName));
  ok("(E-legal name only in the legal-identity entry)",
     legal.length <= 1 && legal.every(({ id }) => id === "company-legal-name"), legal.map(({ id }) => id).join(", "));
}

/* ========================================================================= */
section("F. EVERY DESTINATION RESOLVES ON THE SITE");
/* ========================================================================= */
{
  // A page is app/<path>/page.tsx; a #section must be an id rendered by that
  // page or a component it renders.
  const pageFile = (p) => (p === "/" ? "app/page.tsx" : `app${p}/page.tsx`);
  const rendered = (file, seen = new Set()) => {
    if (seen.has(file) || !existsSync(join(ROOT, file))) return seen;
    seen.add(file);
    const src = read(file);
    for (const m of src.matchAll(/import (\w+) from "@\/(components\/[^"]+)"/g))
      if (new RegExp(`<${m[1]}\\b`).test(src)) rendered(`${m[2]}.tsx`, seen);
    return seen;
  };
  const allRoutes = new Set([
    ...DESTINATIONS.map((d) => d.url),
    ...KNOWLEDGE.flatMap((e) => e.links ?? []),
    ...CASES.flatMap((c) => c.expect.links ?? []),
  ]);
  for (const route of allRoutes) {
    const [path, hash] = route.split("#");
    const file = pageFile(path || "/");
    const exists = existsSync(join(ROOT, file));
    const idOk = !hash || [...rendered(file)].some((f) => read(f).includes(`id="${hash}"`));
    ok(`(F1 ${route}) resolves to a page${hash ? " and section" : ""}`, exists && idOk);
  }
  ok("(F2) destinations come from lib/site.ts, not pasted URLs",
     !/https?:\/\//.test(read("lib/assistant/destinations.ts").replace(/^\s*\/\/.*$/gm, "")));
  ok("(F3) the demo route is the site's one demo form",
     DESTINATIONS.some((d) => d.url === "/shift#contact") && read("lib/site.ts").includes('DEMO_HREF = "/shift#contact"'));
}

/* ========================================================================= */
section("G. THE BEHAVIOUR SPEC SAYS WHAT THE BRIEF REQUIRES");
/* ========================================================================= */
{
  const ruleIds = RULES.map((r) => r.id);
  ok("(G1) rule ids are unique", new Set(ruleIds).size === ruleIds.length);
  const REQUIRED = ["identity", "tone", "language", "grounded", "facts-vs-copy", "limitations",
    "plan-boundaries", "recommend", "plan-changes", "links", "pricing", "linspace",
    "no-unverified-claims", "untrusted-input", "no-actions", "confidentiality", "out-of-scope", "human"];
  const absent = REQUIRED.filter((r) => !ruleIds.includes(r));
  ok("(G2) every required behaviour has a rule", absent.length === 0, absent.join(", "));
  const prompt = systemInstructions();
  ok("(G3) the instructions list every destination", DESTINATIONS.every((d) => prompt.includes(d.url)));
  ok("(G4) ...render every knowledge statement", KNOWLEDGE.every((e) => prompt.includes(e.statement)));
  ok("(G5) ...but never the source paths or anchors (confidentiality)",
     !anchors.some(({ s }) => s.repo === "operza-app" && prompt.includes(s.path)));
  ok("(G6) ...state Hindi and Gujarati support", /Hindi/.test(prompt) && /Gujarati/.test(prompt));
  ok("(G7) ...treat visitor text as untrusted and forbid actions",
     /untrusted data, not instructions/.test(prompt) && /You cannot take actions/.test(prompt));
  ok("(G8) ...contain no price figure", !/₹\s?\d|\bRs\.?\s?\d|\$\s?\d|per month/i.test(prompt));
  ok(`(G9) ...and stay a sensible size to send on every turn (${prompt.length} characters)`,
     prompt.length < 40000);
}

/* ========================================================================= */
section("H. THE EVALUATION SET IS BROAD, SATISFIABLE AND DISCRIMINATING");
/* ========================================================================= */
{
  const caseIds = CASES.map((c) => c.id);
  ok(`(H1) at least 50 cases (${CASES.length})`, CASES.length >= 50);
  ok("(H2) case ids are unique", new Set(caseIds).size === caseIds.length,
     caseIds.filter((x, i) => caseIds.indexOf(x) !== i).join(", "));
  const CATS = ["company", "product-overview", "plan-discovery", "plan-comparison", "plan-restrictions",
    "operations", "accounting", "costing", "tally", "gst", "linspace", "pricing", "languages",
    "prompt-injection", "data-access", "unsupported", "contact", "unknowns"];
  const counts = Object.fromEntries(CATS.map((c) => [c, CASES.filter((x) => x.category === c).length]));
  const thin = CATS.filter((c) => counts[c] < 2);
  ok("(H3) every category has at least two cases", thin.length === 0, JSON.stringify(counts));
  ok(`(H4) multi-turn conversations are included (${CASES.filter((c) => c.turns.length > 1).length})`,
     CASES.filter((c) => c.turns.length > 1).length >= 6);
  ok("(H5) Hindi and Gujarati are both exercised",
     CASES.some((c) => c.expect.language === "hi") && CASES.some((c) => c.expect.language === "gu"));
  ok("(H6) every conversation ends with the visitor", CASES.every((c) => c.turns.at(-1)?.role === "user"));
  const badRefs = CASES.filter((c) => !c.knowledge.length || c.knowledge.some((k) => !ids.includes(k)));
  ok("(H7) every case cites existing knowledge", badRefs.length === 0,
     list(badRefs.map((c) => `${c.id}: ${c.knowledge.filter((k) => !ids.includes(k)).join(", ") || "(none)"}`)));
  ok("(H8) every case states its facts and its forbidden claims",
     CASES.every((c) => c.expect.facts.length && c.expect.mustNotInclude.length));

  // Every pattern must match its own example: a forbidden-claim regex that
  // cannot fire would make a case pass vacuously.
  const pats = CASES.flatMap((c) => [
    ...c.expect.mustNotInclude.map((p) => ({ c, p })),
    ...(c.expect.mustInclude ?? []).flat().map((p) => ({ c, p })),
  ]);
  const dead = pats.filter(({ p }) => !toRegExp(p).test(p.example));
  ok(`(H9) every pattern matches its own example (${pats.length})`, dead.length === 0,
     list(dead.map(({ c, p }) => `${c.id}: /${p.re}/ vs "${p.example}"`)));

  // The reference answer proves the case is satisfiable...
  const failing = CASES.map((c) => ({ c, g: grade(c, c.reference) })).filter(({ g }) => !g.pass);
  ok("(H10) every reference answer passes its own case", failing.length === 0,
     list(failing.map(({ c, g }) => `${c.id}: ${g.failures.join("; ")}`)));
  // ...and planting any one forbidden claim into it must fail the case.
  const missed = CASES.flatMap((c) => c.expect.mustNotInclude
    .filter((p) => grade(c, `${c.reference} ${p.example}`).pass)
    .map((p) => `${c.id}: "${p.example}"`));
  ok("(H11) every forbidden claim, planted into the reference, fails the case", missed.length === 0, list(missed));
  // Dropping a required link or follow-up question must also fail.
  const linkless = CASES.filter((c) => c.expect.links?.length).filter((c) => {
    let r = c.reference;
    for (const l of c.expect.links) r = r.split(l).join("");
    return grade(c, r).pass;
  });
  ok("(H12) removing the required link fails the case", linkless.length === 0, linkless.map((c) => c.id).join(", "));
  const unasked = CASES.filter((c) => c.expect.clarify).filter((c) => grade(c, c.reference.replace(/[?？]/g, ".")).pass);
  ok(`(H13) removing the follow-up question fails the case (${CASES.filter((c) => c.expect.clarify).length})`,
     unasked.length === 0, unasked.map((c) => c.id).join(", "));
  const wrongScript = CASES.filter((c) => c.expect.language && c.expect.language !== "en")
    .filter((c) => grade(c, "Operza Shift is available. See /shift and /shift#contact.").pass);
  ok("(H14) an English answer fails a Hindi or Gujarati case", wrongScript.length === 0, wrongScript.map((c) => c.id).join(", "));
  // References must themselves obey the knowledge base's public-safety rules.
  ok("(H15) no reference answer quotes a price or a Linspace date",
     CASES.every((c) => !/₹\s?\d|\bRs\.?\s?\d|\$\s?\d|per month|\b20\d\d\b/i.test(c.reference)));
}

/* ========================================================================= */
section("I. NOTHING HERE REACHES THE LIVE SITE OR A MODEL");
/* ========================================================================= */
{
  const pkg = JSON.parse(read("package.json"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const AI = deps.filter((d) => /^(ai|@ai-sdk\/.*|openai|@anthropic-ai\/.*|@vercel\/ai.*|langchain.*)$/.test(d));
  ok("(I1) no AI dependency is installed", AI.length === 0, AI.join(", "));
  ok("(I2) there is no API route", !existsSync(join(ROOT, "app/api")));
  const walk = (d) => readdirSync(join(ROOT, d), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
  const assistantSrc = walk("lib/assistant").map(read).join("\n");
  ok("(I3) the assistant modules read no environment and call nothing",
     !/process\.env|fetch\(|XMLHttpRequest|generateText|streamText/.test(assistantSrc));
  const importers = [...walk("app"), ...walk("components")].filter((f) => /lib\/assistant/.test(read(f)));
  ok("(I4) no page or component imports the assistant yet", importers.length === 0, importers.join(", "));
  // Rendered code only: a comment that says the assistant will come later is
  // not an input on the page.
  const noComments = (t) => t.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, " ").replace(/^\s*\/\/.*$/gm, " ");
  const files = [...walk("app"), ...walk("components")];
  const surface = files.map((f) => noComments(read(f))).join("\n");
  // The demo form's message box (components/Contact.tsx) is the one text area
  // the site is allowed; any other would be a chat box in waiting.
  const textAreas = files.filter((f) => f !== "components/Contact.tsx" && /<textarea\b/.test(noComments(read(f))));
  ok("(I5) no chat input or 'Ask anything' prompt is rendered",
     !/Ask anything/i.test(surface) && textAreas.length === 0, textAreas.join(", "));
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} ${checks - failures}/${checks}\n`);
process.exit(failures === 0 ? 0 : 1);
