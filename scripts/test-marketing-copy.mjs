// ---------------------------------------------------------------------------
// HOMEPAGE MARKETING COPY GUARD
//
// The trap with a copy test is that it becomes a grep over source, at which
// point a comment explaining a rule, an import path, and a CSS class all count
// as "customer-facing copy". Then the only way to green is to rename the
// codebase, which is never the point.
//
// So this extracts CUSTOMER-VISIBLE STRINGS first, with comments stripped, and
// judges only those. The extraction approach is adapted from the shipping
// terminology harness in operza-app (scripts/test-shipping-terminology.mjs),
// which solved the same problem for the product UI.
//
// The em-dash rule is expressed semantically rather than as a whitelist. A
// string whose ENTIRE value is the glyph is an empty-value table placeholder
// and is exempt; an em dash sitting inside a sentence is prose and is not.
// That way the rule keeps working as copy changes, and nobody has to maintain
// a list of blessed line numbers.
//
// The Health Check route is now part of this surface. It was excluded while its
// copy was still the older version; that exclusion is closed.
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

let checks = 0, failures = 0;
const ok = (label, cond, detail = "") => {
  checks++; if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${!cond && detail ? `\n      ${detail}` : ""}`);
};
const section = (t) => console.log(`\n---- ${t} ----`);

const EM_DASH = "—";

/** Comments are not UI. A JSX {/* … *\/} block is not rendered either. */
const strip = (t) =>
  t.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, (m) => "\n".repeat((m.match(/\n/g) ?? []).length))
   .split("\n").map((l) => (/^\s*\/\//.test(l) ? "" : l)).join("\n");

// A JSX "text node" full of operators is code, not copy.
const CODEY = /=>|useState|useEffect|=\s*\{|\)\s*;|\bconst\b|\breturn\b|\?\?|\.map\(|\.filter\(|===|!==|\|\||&&\s|\.join\(|\.\w+\(/;
const TYPEY = /^[;,]?\s*\w+\??:\s*(Map|Set|Record|Array|Promise|React\.|string|number|boolean|readonly)\b/;
const PROPS = /\b(title|label|description|placeholder|alt|screen|caption|aria-label|eyebrow|heading|question|answer|tagline|audience|body)\s*=\s*"([^"]{2,400})"/g;

/** Every customer-visible string in a file, with its line number. */
function visibleStrings(file) {
  const src = strip(read(file));
  const at = (i) => src.slice(0, i).split("\n").length;
  const out = [];
  const add = (line, kind, text) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (t.length < 2 || !/[a-zA-Z]{2}/.test(t)) return;
    if (kind.startsWith("jsx") && (CODEY.test(t) || TYPEY.test(t))) return;
    if (/\$\{[^}]*$/.test(t)) return;
    out.push({ file, line, kind, text: t });
  };
  for (const m of src.matchAll(PROPS)) add(at(m.index), `prop:${m[1]}`, m[2]);
  // Object-literal copy: the FAQ array, the plan cards, the claim blocks.
  for (const key of ["question", "answer", "title", "body", "tagline", "audience", "alt", "screen", "caption", "label"])
    for (const m of src.matchAll(new RegExp(`\\b${key}:\\s*"([^"]{2,600})"`, "g")))
      add(at(m.index), `data:${key}`, m[1]);
  // Copy assigned to a variable that is later rendered.
  for (const m of src.matchAll(/\b(?:title|body|reasonText)\s*=\s*[`"]([^`"]{4,400})[`"]\s*;/g))
    add(at(m.index), "assigned", m[1].replace(/\$\{[^}]*\}/g, "…"));
  for (const m of src.matchAll(/return\s+"([^"]{3,200})"\s*;/g)) add(at(m.index), "helper:return", m[1]);
  for (const m of src.matchAll(/\{"\s*([^"]{2,200}?)\s*"\}/g)) add(at(m.index), "jsx-expr-string", m[1]);
  for (const m of src.matchAll(/>([^<>{}\n][^<>{}]{2,400})</g)) add(at(m.index), "jsx-text", m[1]);
  for (const m of src.matchAll(/>\s*\n\s*([A-Za-z][^<>{}]{6,400}?)\s*\n\s*</g)) add(at(m.index), "jsx-block", m[1]);
  return out;
}

/** The homepage surface: the page, everything it composes, and the shared copy
 *  data. HealthCheck.tsx is excluded (separate change). */
const COMPONENTS = readdirSync(join(ROOT, "components"))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => `components/${f}`);
const SURFACE = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/health-check/page.tsx",
  "app/health-check/HealthCheck.tsx",
  "lib/faq.ts",
  "lib/site.ts",
  ...COMPONENTS,
];
const strings = SURFACE.flatMap(visibleStrings);
const show = (rs) => rs.slice(0, 5).map((r) => `${r.file}:${r.line} [${r.kind}] ${r.text.slice(0, 90)}`).join("\n      ");

/* ========================================================================= */
section("A. THE SWEEP FOUND COPY TO JUDGE");
/* ========================================================================= */
ok(`(A1) extracted customer-visible strings (${strings.length} across ${SURFACE.length} files)`,
   strings.length > 150, `only ${strings.length} found; the extractor may be broken`);
ok("(A2) the Health Check route is inside the judged surface",
   SURFACE.includes("app/health-check/HealthCheck.tsx")
   && SURFACE.includes("app/health-check/page.tsx"));

/* ========================================================================= */
section("B. NO EM DASH IN RENDERED MARKETING PROSE");
/* ========================================================================= */
{
  // The exemption, stated as a rule rather than a list: a string that IS the
  // glyph is an empty-value placeholder in a table. Anything else is prose.
  const isPlaceholderGlyph = (t) => t === EM_DASH;
  const hits = strings.filter((r) => r.text.includes(EM_DASH) && !isPlaceholderGlyph(r.text));
  ok("(B1) no em dash appears inside rendered prose", hits.length === 0, show(hits));

  // Every em dash left in non-comment source across the surface must be a
  // standalone "—" string literal. Checked against the source rather than the
  // extracted set, because a bare glyph inside a ternary is not prose and the
  // extractor correctly ignores it, which would make this check vacuous.
  const stray = [];
  const glyphFiles = new Set();
  let glyphCount = 0;
  for (const f of SURFACE) {
    strip(read(f)).split("\n").forEach((line, i) => {
      if (!line.includes(EM_DASH)) return;
      const bare = line.match(/"—"|>—</g) ?? [];
      const total = (line.match(/—/g) ?? []).length;
      glyphCount += bare.length;
      if (bare.length) glyphFiles.add(f);
      if (bare.length !== total) stray.push(`${f}:${i + 1} ${line.trim().slice(0, 90)}`);
    });
  }
  ok("(B2) every remaining em dash is a standalone placeholder glyph",
     stray.length === 0, stray.slice(0, 5).join("\n      "));
  // Stated as a rule rather than a count. The exact number moves whenever a
  // table column changes, and pinning it would only produce churn; what must
  // stay true is that the empty-value glyph never appears outside the demo's
  // tables, which are the only place a blank cell is meaningful.
  ok(`(B3) every placeholder glyph lives in the demo tables (${glyphCount} across ${glyphFiles.size} file)`,
     glyphCount > 0 && [...glyphFiles].every((f) => f === "components/InteractiveProductionDemo.tsx"),
     [...glyphFiles].join(", "));
}

/* ========================================================================= */
section("C. VOCABULARY FOLLOWS THE SHIPPED PRODUCT");
/* ========================================================================= */
{
  // "part" is also an ordinary English word. The rule bans calling the
  // purchased inventory object a part; it does not ban "part of", "that part",
  // or "the parts of Operza that matter to you". The idiomatic forms are
  // removed before the check, which is narrower and more honest than either
  // banning the letters outright or whitelisting the two sentences that use
  // them today.
  const withoutIdiom = (t) =>
    t.replace(/\b(?:a |the |that |this |any |every |some |most )?parts?\s+of\b/gi, " ")
     .replace(/\b(?:that|this|the last|the first|the next|the hard|the best)\s+parts?\b/gi, " ")
     .replace(/\b(?:take|takes|taking|took)\s+part\b/gi, " ")
     .replace(/\bin part\b/gi, " ")
     .replace(/\bskip that part\b/gi, " ");

  const banned = [
    ["part / parts", /\bparts?\b/i, withoutIdiom],
    ["raw material", /\braw\s+materials?\b/i],
    ["FG", /\bFG\b/],
    ["atomic / atomically", /\batomic/i],
    ["WAC", /\bWAC\b/],
    ["cost intelligence", /cost\s+intelligence/i],
    ["suite", /\bsuites?\b/i],
    ["slug", /\bslugs?\b/i],
    // "transactional" alone let "in one transaction" ship on the demo card.
    ["database / RPC / migration vocabulary",
     /\b(database|RPC|migration|SQL|schema|rollback|transactions?|transactional)\b/i],
  ];
  for (const [name, re, pre] of banned) {
    const hits = strings.filter((r) => re.test(pre ? pre(r.text) : r.text));
    ok(`(C-${name}) no customer-visible "${name}"`, hits.length === 0, show(hits));
  }
  // The idiom exemption must not become a hole: "raw materials" and the
  // inventory sense both still fail if reintroduced.
  ok("(C-guard) the part-idiom exemption does not swallow the inventory sense",
     /\bparts?\b/i.test(withoutIdiom("Add parts with units and alert levels"))
     && !/\bparts?\b/i.test(withoutIdiom("the parts of Operza that matter to you")));
}

/* ========================================================================= */
section("D. LOCKED CLAIM BOUNDARIES");
/* ========================================================================= */
{
  const forbidden = [
    ["automatic Tally sync", /(automatic|direct|two-way|real[- ]time|live)\s+(sync|link|connection)|syncs?\s+(automatically|to tally)|push to tally/i],
    ["Tally connector", /\bconnector\b/i],
    ["coming soon", /coming soon/i],
    ["free-tier implication", /no credit card|free trial|free forever|start for free/i],
    ["invented pricing", /₹\s?\d|\bper (month|user|seat)\b|\/mo\b/i],
    ["absolute privacy promise", /never share your details|only the people you add/i],
    ["fabricated proof", /trusted by|customers love|\d+\+? (factories|customers|manufacturers) (use|trust)/i],
    ["ROI claim", /save \d+%|increase your margin|\d+x (faster|return)/i],
    ["plan switching", /upgrade (later|anytime)|switch plans|change your plan/i],
    ["demo runs real logic", /same logic the real product|runs the real/i],
    ["Purchasing workspace", /purchasing workspace/i],
    ["reorder suggestion feature", /suggested reorder|reorder quantit|reorder suggestion|recommended reorder|reorder timing/i],
    ["replenishment messaging", /replenishment|stability restored|production stability/i],
    ["invented supplier fixtures", /TimberWorks|FastFix Hardware|ChemBond/],
    // Retired with the Health Check refresh. A cold prospect is never sent to
    // the login screen, and the page no longer frames itself around money.
    ["prospect login CTA", /\bOpen app\b|\bOpen Operza\b/],
    ["setup-time promise", /set ?up (takes|in) (minutes|a few minutes)/i],
    ["money-loss framing", /quietly losing money|losing money|silently costing|costing you (time|money|margin)/i],
    ["market-wide generalisation", /\bmost (factories|manufacturers|businesses)\b/i],
    ["SKU scale claim", /\d+\s*SKUs\b/i],
    ["predictive replenishment", /predictive|reorder points? (are|exist)|forecasts? (demand|stock)/i],
    ["inventory-only positioning", /inventory and production tracking/i],
  ];
  for (const [name, re] of forbidden) {
    const hits = strings.filter((r) => re.test(r.text));
    ok(`(D-${name}) no "${name}" claim`, hits.length === 0, show(hits));
  }

  // The demo previously ended in a "Purchasing workspace" with supplier names,
  // suggested reorder quantities and replenishment timing. Operza has Purchases
  // and Suppliers but no reorder-suggestion surface, so none of that may come
  // back. Checked on the two files that carried it, against rendered strings
  // rather than source, so a leftover internal identifier during a future
  // refactor would not fail the build while nothing reaches the screen.
  const demoStrings = visibleStrings("components/InteractiveProductionDemo.tsx");
  const experienceStrings = visibleStrings("components/ProductExperience.tsx");
  ok("(D4) the demo shows no purchasing or reorder surface",
     !demoStrings.some((r) => /purchasing|reorder|supplier|replenish/i.test(r.text)),
     show(demoStrings.filter((r) => /purchasing|reorder|supplier|replenish/i.test(r.text))));
  ok("(D5) ...and does not speak as though Operza were recommending purchases",
     !demoStrings.some((r) => /Operza recommends/i.test(r.text)),
     show(demoStrings.filter((r) => /Operza recommends/i.test(r.text))));
  ok("(D6) the section intro no longer promises a reorder suggestion",
     !experienceStrings.some((r) => /reorder|purchasing|supplier/i.test(r.text)),
     show(experienceStrings.filter((r) => /reorder|purchasing|supplier/i.test(r.text))));
  ok("(D7) ...and still frames the demo as a simplified example",
     experienceStrings.some((r) => /simplified interactive example/i.test(r.text)));
  ok("(D8) the demo still ends inside the production flow",
     demoStrings.some((r) => /Production completed\.$/.test(r.text) || /alert level/.test(r.text)));

  // The Tally paragraph must still make its three approved statements.
  const tally = read("components/BooksAndTally.tsx");
  ok("(D1) the Tally claim is the approved export sentence",
     /exports recorded invoices and bills as a file your\s+accountant imports into TallyPrime/.test(tally));
  ok("(D2) ...plus the ledger-name import",
     /import your existing\s+Tally ledger names/.test(tally));
  ok("(D3) ...plus the already-sent invariant, stated as entries not periods",
     /tracks which entries have already been sent,\s+so the same entries are not exported again/.test(tally));
}

/* ========================================================================= */
section("E. THE CAPABILITY SEAM IS NOT BLURRED");
/* ========================================================================= */
{
  // Factory has no accounting, so its section must not claim an invoice is
  // posted to the books. Books has no inventory, so its own story must not
  // claim stock movement. Both connections belong to Complete and are stated
  // there, labelled.
  const factory = visibleStrings("components/RunYourFactory.tsx");
  const booksBridge = read("components/RunYourBooks.tsx");
  ok("(E1) the Factory section does not claim an accounting entry",
     !factory.some((r) => /records the sale|in your books|posts an invoice|accounting/i.test(r.text)),
     show(factory.filter((r) => /records the sale|in your books|accounting/i.test(r.text))));
  ok("(E2) the Factory dispatch claim stops at the invoice reference",
     factory.some((r) => /invoice reference/.test(r.text)));
  ok("(E3) the cross-capability claim is labelled as Operza Complete",
     /In Operza Complete/.test(booksBridge)
     && /Dispatches record the sale,\s+and supplier bills can receive their linked materials into stock/.test(booksBridge));
  ok("(E4) valuation feeding the statements is scoped to Books",
     /Where Books is enabled/.test(read("components/Costing.tsx")));
  const costing = read("components/Costing.tsx");
  ok("(E4b) pinning closing stock is stated as something the user does",
     /You can pin the value at month and year ends/.test(costing)
     && !/and pinned at month and year ends/.test(costing));
  ok("(E4c) no unevidenced claim about what most factories do",
     !/most factories/i.test(costing));
  ok("(E5) margin is stated as gross margin, never as profit",
     /gross margin/i.test(read("components/Costing.tsx"))
     && !/net profit|profit you made|actual profit/i.test(read("components/Costing.tsx")));
}

/* ========================================================================= */
section("F. NAVIGATION RESOLVES");
/* ========================================================================= */
{
  const page = read("app/page.tsx");
  const rendered = SURFACE.map(read).join("\n");
  const ids = new Set([...rendered.matchAll(/\bid="([a-z-]+)"/g)].map((m) => m[1]));
  const anchors = new Set([
    ...[...rendered.matchAll(/href="\/?#([a-z-]+)"/g)].map((m) => m[1]),
    // NAV_LINKS and the footer columns declare targets as data, not as a JSX
    // href attribute, so they need their own sweep or the nav goes unchecked.
    ...[...rendered.matchAll(/href:\s*"\/?#([a-z-]+)"/g)].map((m) => m[1]),
  ]);
  ok(`(F0) anchors were actually collected (${anchors.size})`, anchors.size >= 5,
     [...anchors].join(", "));
  for (const a of anchors)
    ok(`(F1-#${a}) the anchor "#${a}" has a section on the page`, ids.has(a),
       `known ids: ${[...ids].join(", ")}`);
  ok("(F2) no retired anchor survives",
     !["features", "workflow", "screenshots", "simulator", "blind-spots"].some((a) => anchors.has(a)),
     [...anchors].join(", "));
  ok("(F3) the page composes the locked section order",
     /<Hero \/>[\s\S]*<Plans \/>[\s\S]*<RunYourFactory \/>[\s\S]*<Costing \/>[\s\S]*<RunYourBooks \/>[\s\S]*<BooksAndTally \/>[\s\S]*<CorrectionsAndHistory \/>[\s\S]*<ProductExperience \/>[\s\S]*<FAQ \/>[\s\S]*<Contact \/>/.test(page));
  ok("(F4) the retired sections are gone from the page",
     !/BlindSpots|HealthCheckCTA|Workflow|Features|Screenshots|FinalCTA|FloatingAudit/.test(page));
}

/* ========================================================================= */
section("G. FAQ HAS ONE SOURCE OF TRUTH");
/* ========================================================================= */
{
  const page = read("app/page.tsx");
  const faqComponent = read("components/FAQ.tsx");
  ok("(G1) the structured data is generated, not hand-written",
     /faqJsonLd\(\)/.test(page) && !/acceptedAnswer/.test(page));
  ok("(G2) the visible list reads the same array", /FAQ_ITEMS/.test(faqComponent));
  const { FAQ_ITEMS, faqJsonLd } = await import("../lib/faq.ts").catch(() => ({}));
  ok("(G3) the pricing answer is exactly the approved sentence",
     read("lib/faq.ts").includes('answer: "Pricing is discussed during the demo."'));
  const questionCount = (read("lib/faq.ts").match(/question:\s*"/g) ?? []).length;
  ok(`(G4) there are nine questions (${questionCount})`, questionCount === 9);
  ok("(G5) no question survives from the old FAQ",
     !/Will it work on a slow internet connection|Backups run automatically|five to fifty/.test(read("lib/faq.ts")));
}

/* ========================================================================= */
section("H. CONTACT KEEPS ITS EXISTING WRITE PATH");
/* ========================================================================= */
{
  const contact = read("components/Contact.tsx");
  ok("(H1) still inserts into demo_requests through the same client",
     /from\("demo_requests"\)/.test(contact) && /getSupabaseClient/.test(contact));
  ok("(H2) the honeypot survives", /name="website"/.test(contact) && /tabIndex=\{-1\}/.test(contact));
  ok("(H3) the qualification is encoded into the existing message field",
     /Needs: \$\{need\}/.test(contact) && /composeMessage/.test(contact));
  ok("(H4) ...and no new column is written",
     !/needs:/.test(contact.slice(contact.indexOf("const payload"), contact.indexOf("if (!payload.name"))));
  ok("(H5) the helper line is the approved wording",
     /use these details to contact you about Operza/.test(contact));
}

/* ========================================================================= */
section("J. THE HEALTH CHECK REPORTS RATHER THAN ALARMS");
/* ========================================================================= */
{
  const hc = read("app/health-check/HealthCheck.tsx");
  const hcStrings = visibleStrings("app/health-check/HealthCheck.tsx");

  ok("(J1) the score is qualified as a self-assessment, not a benchmark",
     /simple self-assessment based on your answers, not an\s+industry benchmark/.test(hc));
  ok("(J2) the score carries a plain descriptor",
     hcStrings.some((r) => /Operational visibility score/.test(r.text)));
  ok("(J3) the scoring model is untouched: eight questions, 3-point scale",
     /const MAX_SCORE = QUESTIONS\.length \* 3;/.test(hc)
     && (hc.match(/\bid:\s*"/g) ?? []).length === 8);
  ok("(J4) ...and the band thresholds are unchanged",
     /if \(score >= 85\)/.test(hc) && /if \(score >= 60\)/.test(hc));
  ok("(J5) the standalone consequences section is gone",
     !/CONSEQUENCES/.test(hc) && !/function Consequences/.test(hc));
  ok("(J6) the retired result wording does not survive",
     !/memory and goodwill|quietly costing|every order you take|what tends to break first/i.test(hc));
  // The ASSESSMENT stays factory-scoped. Widening the questions into an
  // accounting quiz would duplicate what the homepage already explains, so the
  // check is scoped to the question and weakness data rather than the whole
  // page: exactly one labelled Complete bridge is allowed, and required.
  const assessmentData = hc.slice(hc.indexOf("const QUESTIONS"), hc.indexOf("// Scoring"));
  const BOOKS = /\b(invoice|ledger|balance sheet|trial balance|GST|bookkeep|payments?)\b/i;
  ok("(J7) the questions and weakness copy ask nothing about the books",
     !BOOKS.test(assessmentData),
     (assessmentData.match(new RegExp(`.{0,50}${BOOKS.source}.{0,50}`, "i")) ?? [])[0]);
  const bridges = [...hc.matchAll(/Need the books too\?/g)].length;
  ok(`(J7b) exactly one labelled Operza Complete bridge (${bridges})`,
     bridges === 1 && /Operza Complete connects the factory with/.test(hc));
  ok("(J8) motion honours the OS setting for both scroll and the score count-up",
     /prefers-reduced-motion: reduce/.test(hc)
     && /behavior: prefersReducedMotion\(\) \? "auto" : "smooth"/.test(hc)
     && /if \(prefersReducedMotion\(\)\) \{\s*setValue\(safeTarget\);/.test(hc));
}

/* ========================================================================= */
section("I. PRODUCT VISUALS ARE REAL CAPTURES");
/* ========================================================================= */
{
  const frame = read("components/ScreenshotFrame.tsx");
  ok("(I1) no pending-capture placeholder survives anywhere",
     !SURFACE.some((f) => /Screenshot pending|PendingCapture|Awaiting an approved capture/.test(read(f))));
  ok("(I2) the frame demands a real file rather than falling back to a drawing",
     /src: string;/.test(frame) && !/src\?: string/.test(frame));

  // Collect every declared capture and check it exists on disk.
  const shots = [];
  for (const f of SURFACE) {
    for (const m of read(f).matchAll(/src:\s*"(\/product\/[^"]+)"/g)) shots.push([f, m[1]]);
  }
  ok(`(I3) the page ships a small, chosen set of captures (${shots.length})`,
     shots.length >= 5 && shots.length <= 8, shots.map(([, s]) => s).join(", "));
  for (const [f, src] of shots)
    ok(`(I4-${src}) the file exists`, existsSync(join(ROOT, "public", src)), `declared in ${f}`);

  // Every frame needs alt text, and money-bearing ones need the sample chip.
  const declBlocks = SURFACE.flatMap((f) =>
    [...read(f).matchAll(/:\s*Shot\s*=\s*\{[\s\S]*?\n\};/g)].map((m) => [f, m[0]]),
  );
  for (const [f, block] of declBlocks) {
    const src = (block.match(/src:\s*"([^"]+)"/) ?? [])[1] ?? "?";
    ok(`(I5-${src}) has descriptive alt text`,
       (block.match(/alt:\s*"([^"]{40,})"/) ?? []).length > 0, f);
  }
  // The two statements-and-money captures must be labelled as sample data.
  for (const needle of ["trial-balance", "payments", "cost-changes", "dispatch-order-totals"]) {
    const block = declBlocks.find(([, b]) => b.includes(needle));
    ok(`(I6-${needle}) money-bearing capture is marked as a sample workspace`,
       !!block && /sample:\s*true/.test(block[1]));
  }
  ok("(I7) the frame renders that chip visibly",
     /Sample workspace/.test(frame) && /shot\.sample &&/.test(frame));
}

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} ${checks - failures}/${checks}\n`);
process.exit(failures === 0 ? 0 : 1);
