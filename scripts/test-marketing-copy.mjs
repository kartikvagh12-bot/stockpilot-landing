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

/** The judged surface: every page on the site, everything they compose, and
 *  the shared copy data. Components are collected recursively, so a new
 *  subfolder (components/art, components/demos) can never fall outside it. */
const walk = (dir) =>
  readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith(".tsx") ? [`${dir}/${e.name}`] : []);
const COMPONENTS = walk("components").filter((f) => !f.startsWith("components/demos/"));
const DEMO_FILES = readdirSync(join(ROOT, "components/demos"))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => `components/demos/${f}`);

// Pages. The company homepage, Operza Shift (the manufacturing story that the
// homepage told before the 2026-11 cutover) and Operza Linspace.
const HOME = "app/page.tsx";
const SHIFT_PAGE = "app/shift/page.tsx";
const LINSPACE_PAGE = "app/linspace/page.tsx";

const SURFACE = [
  HOME,
  SHIFT_PAGE,
  LINSPACE_PAGE,
  "app/layout.tsx",
  "app/health-check/page.tsx",
  "app/health-check/HealthCheck.tsx",
  "lib/faq.ts",
  "lib/site.ts",
  ...COMPONENTS,
  ...DEMO_FILES,
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
ok("(A3) every page and every component is inside the judged surface",
   [HOME, SHIFT_PAGE, LINSPACE_PAGE].every((f) => existsSync(join(ROOT, f)))
   && walk("components").every((f) => SURFACE.includes(f)));

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
  // The empty-value table glyphs went with the old demo, so there is now no
  // exemption to carry: the surface should hold no em dash at all.
  ok(`(B3) no em dash of any kind survives on the surface (${glyphCount} glyph, ${stray.length} prose)`,
     glyphCount === 0 && stray.length === 0, [...glyphFiles].join(", "));
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
  const demoStrings = DEMO_FILES.flatMap(visibleStrings);
  const experienceStrings = visibleStrings("components/ProductExperience.tsx");
  // "Supplier" and "supplier bill" are real Operza vocabulary and appear in
  // the Books example. What must never return is the invented purchasing
  // SURFACE: a workspace, suggested quantities, or replenishment timing.
  const FICTIONAL_PURCHASING =
    /purchasing workspace|suggested reorder|reorder quantit|reorder suggestion|recommended reorder|reorder timing|replenish/i;
  ok("(D4) the examples show no purchasing or reorder surface",
     !demoStrings.some((r) => FICTIONAL_PURCHASING.test(r.text)),
     show(demoStrings.filter((r) => FICTIONAL_PURCHASING.test(r.text))));
  ok("(D5) ...and does not speak as though Operza were recommending purchases",
     !demoStrings.some((r) => /Operza recommends/i.test(r.text)),
     show(demoStrings.filter((r) => /Operza recommends/i.test(r.text))));
  ok("(D6) the section intro no longer promises a reorder suggestion",
     !experienceStrings.some((r) => /reorder|purchasing|supplier/i.test(r.text)),
     show(experienceStrings.filter((r) => /reorder|purchasing|supplier/i.test(r.text))));
  ok("(D7) ...and still frames the interactions as simplified examples",
     experienceStrings.some((r) => /simplified examples/i.test(r.text)));
  ok("(D8) the factory example still ends inside the production flow",
     /finished units added/i.test(read("components/demos/FactoryDemo.tsx"))
     && /Dispatched \$\{DISPATCH_QTY\} units/.test(read("components/demos/FactoryDemo.tsx")));

  // The Tally paragraph must still make its three approved statements.
  const tally = read("components/CompleteSection.tsx");
  const flat = (t) => t.replace(/\s+/g, " ");
  ok("(D1) the Tally claim is the approved export sentence",
     /exports recorded invoices and bills as a file your accountant imports into TallyPrime/.test(flat(tally)));
  ok("(D2) ...plus the ledger-name import",
     /import your existing Tally ledger names/.test(flat(tally)));
  ok("(D3) ...plus the already-sent invariant, stated as entries not periods",
     /tracks which entries have already been sent/.test(flat(tally))
     && !/month|period/i.test(flat(tally).match(/tracks which entries[^.]*\./)?.[0] ?? ""));
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
  const booksBridge = read("components/CompleteSection.tsx");
  ok("(E1) the Factory section does not claim an accounting entry",
     !factory.some((r) => /records the sale|in your books|posts an invoice|accounting/i.test(r.text)),
     show(factory.filter((r) => /records the sale|in your books|accounting/i.test(r.text))));
  ok("(E2) the Factory dispatch claim stops at the reference",
     factory.some((r) => /records the customer, the reference/i.test(r.text)));
  ok("(E3) the cross-capability claim lives in the Operza Complete section",
     /Operza Complete/.test(booksBridge)
     && /reduces stock and records the sale/i.test(booksBridge)
     && /receive the material it paid for/i.test(booksBridge));
  ok("(E4) valuation feeding the statements is scoped to Books",
     /Where Books is enabled/.test(read("components/Costing.tsx")));
  const costing = read("components/Costing.tsx");
  const costingFlat = costing.replace(/\s+/g, " ");
  ok("(E4b) pinning closing stock is stated as something the user does",
     /You can pin the value at month and year ends/.test(costingFlat)
     && !/and pinned at month and year ends/.test(costingFlat));
  ok("(E4c) no unevidenced claim about what most factories do",
     !/most factories/i.test(costing));
  ok("(E5) margin is stated as gross margin, never as profit",
     /gross margin/i.test(read("components/Costing.tsx"))
     && !/net profit|profit you made|actual profit/i.test(read("components/Costing.tsx")));
}

/* ========================================================================= */
section("F. NAVIGATION RESOLVES, PAGE BY PAGE");
/* ========================================================================= */
{
  // Since the multi-product cutover the same anchor name can mean different
  // things on different pages (the homepage has #contact and so does
  // /shift). So an anchor is resolved against the page it names: "/#x" against
  // the homepage, "/shift#x" against the Shift page, and a bare "#x" against
  // every page that renders the file it is written in.
  // Follows only components a file actually RENDERS (a default import used as
  // <Name ...>). Importing data from a component file, as the homepage does
  // with PLANS, does not put that component's sections on the page.
  const importsOf = (file, seen = new Set()) => {
    if (seen.has(file)) return seen;
    seen.add(file);
    const src = read(file);
    for (const m of src.matchAll(/import (\w+) from "@\/(components\/[^"]+)"/g)) {
      const f = `${m[2]}.tsx`;
      if (new RegExp(`<${m[1]}\\b`).test(src) && existsSync(join(ROOT, f))) importsOf(f, seen);
    }
    return seen;
  };
  const PAGES = { "/": HOME, "/shift": SHIFT_PAGE, "/linspace": LINSPACE_PAGE };
  const composition = Object.fromEntries(
    Object.entries(PAGES).map(([route, f]) => [route, [...importsOf(f)]]));
  const idsOn = (route) => new Set(composition[route].flatMap((f) =>
    [...read(f).matchAll(/\bid="([a-z-]+)"/g)].map((m) => m[1])));
  const pagesRendering = (file) => Object.keys(PAGES).filter((r) => composition[r].includes(file));

  const found = [];
  for (const f of SURFACE.filter((f) => !f.startsWith("app/health-check"))) {
    const src = strip(read(f));
    for (const m of src.matchAll(/href(?:=|:\s*)\{?"(\/[a-z-]*)?#([a-z-]+)"/g)) found.push({ f, route: m[1] ?? null, id: m[2] });
  }
  // Data constants that hold a fragment link (DEMO_HREF) count too.
  for (const m of read("lib/site.ts").matchAll(/=\s*"(\/[a-z-]*)#([a-z-]+)"/g))
    found.push({ f: "lib/site.ts", route: m[1], id: m[2] });

  ok(`(F0) anchors were actually collected (${found.length})`, found.length >= 8);
  const unresolved = found.filter(({ f, route, id }) => {
    if (route !== null) return !(route in PAGES) || !idsOn(route).has(id);
    const routes = pagesRendering(f);
    return routes.length === 0 ? false : routes.some((r) => !idsOn(r).has(id));
  });
  ok("(F1) every anchor resolves to a section on the page it points at",
     unresolved.length === 0,
     unresolved.map(({ f, route, id }) => `${f}: ${route ?? ""}#${id}`).join("\n      "));
  ok("(F2) no retired anchor survives",
     !found.some(({ id }) => ["features", "workflow", "screenshots", "simulator", "blind-spots"].includes(id)));
  const shift = read(SHIFT_PAGE);
  ok("(F3) the Shift page composes the manufacturing story in order",
     /<OperzaIntro \/>\s*<Hero \/>[\s\S]*<ProductExperience \/>[\s\S]*<Plans \/>[\s\S]*<RunYourFactory \/>[\s\S]*<Costing \/>[\s\S]*<RunYourBooks \/>[\s\S]*<CompleteSection \/>[\s\S]*<HealthCheckCallout \/>[\s\S]*<FAQ \/>[\s\S]*<Contact \/>/.test(shift));
  ok("(F4) the retired sections are gone from every page",
     [HOME, SHIFT_PAGE, LINSPACE_PAGE].every((f) =>
       !/BlindSpots|HealthCheckCTA|Workflow|Features|Screenshots|FinalCTA|FloatingAudit|BooksAndTally|CorrectionsAndHistory/.test(read(f))));

  // Old homepage links (/#factory and friends) are forwarded to the same
  // section on /shift. The list must name only sections that exist there.
  const fwd = read("components/LegacyAnchorForward.tsx");
  const legacy = [...(fwd.match(/LEGACY_SHIFT_ANCHORS = \[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);
  ok(`(F5) the homepage forwards old manufacturing anchors (${legacy.length})`,
     /<LegacyAnchorForward \/>/.test(read(HOME))
     && ["product", "plans", "factory", "costing", "books", "complete", "faq"].every((a) => legacy.includes(a)));
  ok("(F6) ...each to a section that exists on /shift",
     legacy.every((a) => idsOn("/shift").has(a)), legacy.filter((a) => !idsOn("/shift").has(a)).join(", "));
  ok("(F7) ...and none of them collides with a homepage section",
     legacy.every((a) => !idsOn("/").has(a)), legacy.filter((a) => idsOn("/").has(a)).join(", "));
}

/* ========================================================================= */
section("G. FAQ HAS ONE SOURCE OF TRUTH");
/* ========================================================================= */
{
  // The FAQ is the Operza Shift FAQ, so its structured data lives on /shift,
  // the page that renders it.
  const page = read(SHIFT_PAGE);
  const faqComponent = read("components/FAQ.tsx");
  ok("(G0) the FAQ renders on /shift and its structured data moved with it",
     /<FAQ \/>/.test(page) && !/<FAQ \/>|faqJsonLd/.test(read(HOME)));
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
section("I. THE HOMEPAGE EXPLAINS THROUGH INTERACTION, NOT SCREENSHOTS");
/* ========================================================================= */
{
  // Founder direction (2026-09): the homepage no longer shows the app. Real
  // captures read as blurry documentation and exposed literal product data, so
  // the product story is now website-native interfaces the visitor can click.
  const surfaceSrc = SURFACE.map(read).join("\n");

  ok("(I1) no homepage component references a product screenshot",
     !/\/product\/[a-z0-9-]+\.(png|jpg|webp)/i.test(surfaceSrc),
     (surfaceSrc.match(/\/product\/[a-z0-9-]+\.\w+/i) ?? [])[0]);
  for (const shot of ["dashboard", "run-production", "cost-changes", "dispatch",
                      "payments", "trial-balance", "inventory-movements"])
    ok(`(I2-${shot}) the retired capture is not referenced`,
       !new RegExp(`/product/${shot}`, "i").test(surfaceSrc));

  ok("(I3) the screenshot frame is gone and does not return to the homepage",
     !existsSync(join(ROOT, "components/ScreenshotFrame.tsx"))
     && !/ScreenshotFrame/.test(surfaceSrc));
  ok("(I4) ...and the screenshot assets are gone with it",
     !existsSync(join(ROOT, "public/product")));
  ok("(I5) no next/image product visual sneaks back into the homepage story",
     !/from "next\/image"/.test(SURFACE.filter((f) => f.startsWith("components/")).map(read).join("\n")));

  // What replaced them.
  const demoSrc = DEMO_FILES.map(read).join("\n");
  ok(`(I6) the interactive examples exist (${DEMO_FILES.length} panels)`,
     DEMO_FILES.length >= 4);
  ok("(I7) every example is labelled as an example, not as live data",
     /Interactive example/.test(read("components/demos/demo-ui.tsx")));
  ok("(I8) ...and never claims to be live, real time or customer data",
     !/\b(live data|real[- ]time|customer data|production data|sample workspace)\b/i.test(demoSrc));
  ok("(I9) the examples carry no real customer or sample-workspace figures",
     !/Gurukrupa|Shree Swami|Maharashtra Electrical|Patel Electric|Om Switchgear|Shree Polymers|Balaji Packaging|TimberWorks|INV-00|DSP-0000|RCP-0000|PAY-0000/i.test(demoSrc));
  ok("(I10) they are local state only: no fetch, no storage, no supabase",
     !/\bfetch\(|supabase|localStorage|sessionStorage|axios/i.test(demoSrc));
  ok("(I11) each example that changes state offers a reset",
     ["FactoryDemo", "BooksDemo", "CompleteDemo", "CostingDemo"].every((d) =>
       /ResetButton/.test(read(`components/demos/${d}.tsx`))));
  ok("(I12) state changes are announced, not left to sighted users only",
     /aria-live="polite"/.test(read("components/demos/demo-ui.tsx")));
  // Two interaction invariants that browser review caught. Both are the kind
  // of bug that reads as "the example is broken" rather than as a typo.
  const complete = read("components/demos/CompleteDemo.tsx");
  ok("(I13a) the Complete example allows one dispatch per reset",
     /const inFlight = step !== 0;/.test(complete)
     && /disabled=\{inFlight\}/.test(complete)
     && !/disabled=\{s\.invoiced\}/.test(complete)
     // The render flag alone is not enough: React state is stale inside a
     // burst of clicks, so the handler must test a synchronously written ref.
     && /const started = useRef\(false\);/.test(complete)
     && /if \(started\.current\) return;\s*\n\s*started\.current = true;/.test(complete)
     && /started\.current = false;/.test(complete));
  const px = read("components/ProductExperience.tsx");
  ok("(I13b) every tab panel stays mounted, so its state survives a switch",
     /hidden=\{i !== active\}/.test(px) && !/i === active && m\.render\(\)/.test(px));

  ok("(I13) motion respects the OS setting",
     /prefers-reduced-motion: reduce/.test(read("components/demos/demo-ui.tsx"))
     && /prefersReducedMotion\(\)/.test(read("components/demos/CompleteDemo.tsx")));
}

/* ========================================================================= */
section("K. THE FOUNDER DIRECTION IS ON THE PAGE");
/* ========================================================================= */
{
  const surfaceSrc = SURFACE.map(read).join("\n");
  const flat = surfaceSrc.replace(/\s+/g, " ");

  // Match what RENDERS, not the source: strip any tags and JSX space
  // expressions from the h1 and collapse the wrapping of the literal, so a
  // reflow of the same words can never fail this and a changed word always
  // does.
  const heroH1 = (read("components/Hero.tsx").match(/<h1[\s\S]*?<\/h1>/) ?? [""])[0]
    .replace(/\{"\s*"\}/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  ok("(K1) the rendered hero headline is the approved line",
     heroH1
       === "Run what you make, what you move, what you sell, and the books behind it.",
     heroH1);
  ok("(K2) Open App is present, and not relabelled",
     (flat.match(/Open App/g) ?? []).length >= 3,
     `found ${(flat.match(/Open App/g) ?? []).length}`);
  ok("(K3) ...in the navbar, the Shift hero and the closing area",
     /Open App/.test(read("components/Navbar.tsx"))
     && /Open App/.test(read("components/Hero.tsx"))
     && (/Open App/.test(read("components/Footer.tsx")) || /Open App/.test(read("components/Contact.tsx"))));
  ok("(K3b) ...and on the company homepage's closing area, through SITE.app",
     /Open App/.test(read("components/CompanyContact.tsx"))
     && /href=\{SITE\.app\}/.test(read("components/CompanyContact.tsx")));
  ok("(K4) every Open App resolves through SITE.app rather than a pasted URL",
     !/https:\/\/app\.operza\.in/.test(SURFACE.filter((f) => f !== "lib/site.ts").map(read).join("\n")));

  ok("(K5) the Health Check has a section on the Shift page, not just a footer link",
     existsSync(join(ROOT, "components/HealthCheckCallout.tsx"))
     && /<HealthCheckCallout \/>/.test(read(SHIFT_PAGE)));
  ok("(K6) ...linking to the route",
     /href="\/health-check"/.test(read("components/HealthCheckCallout.tsx")));
  ok("(K7) ...with the approved framing",
     /How visible is your factory operation\?/.test(read("components/HealthCheckCallout.tsx"))
     && /Take the Health Check/.test(read("components/HealthCheckCallout.tsx")));

  const px = read("components/ProductExperience.tsx");
  for (const mode of ["Factory", "Books", "Complete"])
    ok(`(K8-${mode}) the ${mode} interactive mode exists`,
       new RegExp(`label: "${mode}"`).test(px));
  ok("(K9) the modes are a real tablist, keyboard operable",
     /role="tablist"/.test(px) && /role="tab"/.test(px)
     && /role="tabpanel"/.test(px) && /ArrowRight/.test(px));
}

/* ========================================================================= */
section("L. OPERZA SHIFT IS INTRODUCED BEFORE ITS HERO");
/* ========================================================================= */
{
  // Founder direction (2026-09-29): a cold visitor was reading what Operza lets
  // them run before being told what it is. The intro answers that first, then
  // the unchanged hero takes over. Since the multi-product cutover (approved
  // decision 1, 2026-11-17) intro and hero live on /shift, and the intro
  // defines Operza Shift rather than all of Operza.
  const page = read(SHIFT_PAGE);
  const introFile = "components/OperzaIntro.tsx";
  const introSrc = read(introFile);
  const intro = visibleStrings(introFile).map((r) => r.text).join(" ");

  ok("(L1) the intro is the first thing in <main>, directly before the hero",
     /<main>\s*<OperzaIntro \/>\s*<Hero \/>\s*<ProductExperience \/>/.test(page));
  ok("(L2) the intro sits inside the judged surface", SURFACE.includes(introFile));
  // Each rendered paragraph as a visitor reads it: inline accent spans and
  // JSX space expressions removed, wrapping collapsed. Exact equality, so a
  // reflow can never fail these and a changed word always does.
  const introMarkup = strip(introSrc);
  const paras = [...introMarkup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
    m[1].replace(/\{"\s*"\}/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  // The founder-approved 2026-09-29 copy, with "Operza" made "Operza Shift"
  // where it names the product, and nothing else changed.
  const LOCKED = [
    "What is Operza Shift?",
    "Operza Shift is a web-based manufacturing operations and accounting platform built for manufacturers.",
    "It helps digitize the day-to-day flow of a manufacturing business, from materials, products and BOMs through production, packing, inventory and dispatch, while also supporting sales, purchases, costing, payments and financial records.",
    "Instead of information being scattered across spreadsheets, registers and disconnected tools, Operza Shift gives manufacturers a structured system for recording and understanding the work happening across the business.",
  ];
  ok(`(L2b) the intro renders exactly four paragraphs (${paras.length})`, paras.length === 4,
     JSON.stringify(paras));
  ok("(L3) the label is exactly the orientation question", paras[0] === LOCKED[0], paras[0]);
  ok("(L4) the intro gives the locked definition", paras[1] === LOCKED[1], paras[1]);
  ok("(L5) ...then the first locked supporting paragraph", paras[2] === LOCKED[2], paras[2]);
  ok("(L5b) ...then the second", paras[3] === LOCKED[3], paras[3]);

  // The intro defines Operza the software. Factory, Books and Complete are
  // explained further down the page, so no plan is named here at all. That is
  // stricter than the per-plan boundary checks it replaces: with no plan named,
  // no plan can be credited with the other's half.
  const planNames = ["Operza Factory", "Operza Books", "Operza Complete"]
    .filter((p) => paras.join(" ").includes(p) || intro.includes(p));
  ok("(L6) the intro names no plan", planNames.length === 0, planNames.join(", "));

  // Founder review: the short red rule before the label read as a giant em
  // dash. Red is carried by text alone, with no ornament of any kind.
  const labelTag = (introMarkup.match(/<p\b[^>]*id="operza-intro-label"[^>]*>([\s\S]*?)<\/p>/) ?? [])[1] ?? "";
  ok("(L6b) the label holds only its text: no line, dash, dot or icon before it",
     labelTag.trim() === "What is Operza Shift?" && !/aria-hidden/.test(introMarkup), labelTag.trim());
  const labelOpen = (introMarkup.match(/<p\b[^>]*id="operza-intro-label"[^>]*>/) ?? [""])[0];
  // The intro is light, so its red is brand-600, which holds AA contrast on
  // that ground where the logo red (brand-500) does not. Pinned exactly: the
  // label and the one red phrase.
  const reds = (tag) => [...tag.matchAll(/\btext-brand-\d+\b/g)].map((m) => m[0]);
  const phraseOpen = (introMarkup.match(/<span\b[^>]*text-brand-\d+[^>]*>/) ?? [""])[0];
  ok("(L6c) ...and the label itself is set in text-brand-600",
     reds(labelOpen).join() === "text-brand-600", labelOpen);
  ok("(L6c-phrase) ...as is the red phrase in the definition",
     reds(phraseOpen).join() === "text-brand-600", phraseOpen);
  const accents = [...introMarkup.matchAll(/<span\b[^>]*text-brand-\d+[^>]*>([\s\S]*?)<\/span>/g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim());
  ok(`(L6d) red inside the prose is short and sparing (${accents.length} phrase)`,
     accents.length <= 2 && accents.every((a) => a.split(" ").length <= 6 && !/\.$/.test(a)),
     JSON.stringify(accents));
  ok("(L7) the intro stays a definition: no border setting it apart",
     !/\bborder(?:-[a-z]+)?\b/.test(introMarkup));
  ok("(L8) ...and no grid or column layout",
     !/\bgrid\b|grid-cols|col-span/.test(introMarkup));

  // The hero keeps the page's only h1, and nothing ahead of it outranks it.
  ok("(L9) the intro adds no heading element ahead of the hero's h1",
     !/<h[1-6]\b/.test(introSrc) && /<h1\b/.test(read("components/Hero.tsx")));
  ok("(L10) the section is named for assistive tech",
     /aria-labelledby="operza-intro-label"/.test(introSrc) && /id="operza-intro-label"/.test(introSrc));
  ok("(L11) orientation only: no CTA, link, image or fake UI",
     !/<a\b|<button\b|href=|<img\b|next\/image|<svg\b/.test(introSrc));
  ok("(L12) no em dash in the intro", !introSrc.includes(EM_DASH));

  // The customer is a manufacturer, never a "small" one. Judged on rendered
  // strings, so a comment about a small helper or a CSS size stays legal.
  const SMALL_CUSTOMER =
    /\bsmall(?:er)?(?:[\s-]+(?:and|&)[\s-]+(?:growing|medium(?:[\s-]sized)?|mid[\s-]sized))?[\s-]+(?:scale[\s-]+)?(?:manufactur|factor(?:y|ies)|business|firm|compan|workshop|unit|plant|enterprise)/i;
  const small = strings.filter((r) => SMALL_CUSTOMER.test(r.text));
  ok("(L13) no customer-visible copy calls the customer small",
     small.length === 0, show(small));
  ok("(L13-guard) ...and the pattern still catches every phrasing it names",
     ["small manufacturers", "Small and growing manufacturers", "small factories",
      "small business", "small businesses", "small factory", "small manufacturer",
      "small-scale factories"].every((t) => SMALL_CUSTOMER.test(t))
     && !SMALL_CUSTOMER.test("a small helper for the activity list"));
}

/* ========================================================================= */
section("M. THE COMPANY HOMEPAGE IS THE FOUNDER'S, AND FAKES NOTHING");
/* ========================================================================= */
{
  // Founder direction (2026-11-17): Operza is the parent brand, and the
  // homepage introduces the company and its products.
  const home = read(HOME);
  const hero = read("components/CompanyHero.tsx");
  const h1s = [HOME, ...["CompanyHero", "WhatWeBuild", "ShiftShowcase", "LinspacePreview", "Approach", "CompanyContact"]
    .map((c) => `components/${c}.tsx`)].map(read).join("\n").match(/<h1\b/g) ?? [];
  const heroH1 = (hero.match(/<h1[\s\S]*?<\/h1>/) ?? [""])[0]
    .replace(/\{"\s*"\}/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  ok("(M1) the headline is exactly the Founder's line", heroH1 === "Complex work. Clearer possibilities.", heroH1);
  ok(`(M2) ...and it is the homepage's only h1 (${h1s.length})`, h1s.length === 1);
  ok("(M3) the eyebrow is the approved one",
     /<p className="label-invert">Software for complex work<\/p>/.test(hero));
  ok("(M4) the supporting line names the two industries and nothing more",
     /Operza builds software for complex business workflows\. Our first\s+product serves manufacturing, and we&apos;re developing our next\s+for construction\./.test(hero));
  ok("(M5) the hero's actions are the approved pair",
     /Explore our products/.test(hero) && /Book a demo/.test(hero));
  ok("(M6) the homepage composes the approved sections in order",
     /<CompanyHero \/>\s*<WhatWeBuild \/>\s*<ShiftShowcase \/>\s*<LinspacePreview \/>\s*<Approach \/>\s*<CompanyContact \/>/.test(home));

  // The assistant is not built yet, so nothing may pretend to be it: no input,
  // no text area, no "Ask anything" prompt anywhere on the homepage.
  const homeFiles = [HOME, ...["CompanyHero", "WhatWeBuild", "ShiftShowcase", "LinspacePreview", "Approach", "CompanyContact", "Navbar", "Footer"]
    .map((c) => `components/${c}.tsx`)];
  const homeSrc = homeFiles.map((f) => strip(read(f))).join("\n");
  ok("(M7) no fake, disabled or nonfunctional assistant input",
     !/<input\b|<textarea\b|contentEditable|Ask anything|Ask Operza/i.test(homeSrc));
  ok("(M8) the homepage does not run a second lead form: demos go to the one on /shift",
     !/<Contact \/>|demo_requests|getSupabaseClient/.test(homeSrc)
     && /DEMO_HREF = "\/shift#contact"/.test(read("lib/site.ts")));

  // Structured data describes the company only. The product application is
  // on /shift, and an unreleased product gets none.
  const ld = home.slice(home.indexOf("ld+json"));
  ok("(M9) the homepage's structured data is the company, not a product",
     /"@type": "Organization"/.test(ld) && !/SoftwareApplication|FAQPage/.test(ld));
  ok("(M10) the company copy invents nothing about the company",
     !/founded in|since 20\d\d|our team of|\d+\s*(people|employees|engineers)|award|years of experience/i.test(homeSrc));
  // The registered name belongs to the footer's legal line and the
  // Organization's legalName, nowhere else on the page.
  const legalUsers = homeFiles.filter((f) =>
    f !== "components/Footer.tsx" && f !== HOME && /Operza Technologies|SITE\.legalName/.test(strip(read(f))));
  ok("(M11) the legal name never appears as a public brand on the homepage",
     legalUsers.length === 0
     && !/Operza Technologies/.test(strip(home))
     && (strip(home).match(/SITE\.legalName/g) ?? []).length === 1
     && /legalName: SITE\.legalName,/.test(home), legalUsers.join(", "));
}

/* ========================================================================= */
section("N. OPERZA LINSPACE IS PRESENTED AS IN DEVELOPMENT, AND PROMISES NOTHING");
/* ========================================================================= */
{
  // Not launched (Founder, 2026-11-17). It may be introduced as in development
  // with no invented functionality, dates, pricing or availability. For this
  // release candidate: noindex, no waiting list, no early-access sign-up.
  const files = [LINSPACE_PAGE, "components/LinspaceHero.tsx", "components/LinspaceFocus.tsx",
    "components/LinspaceStatus.tsx", "components/LinspacePreview.tsx"];
  const text = files.flatMap(visibleStrings).map((r) => r.text);
  const src = files.map((f) => strip(read(f))).join("\n");
  const all = text.join(" ");

  ok("(N1) the status is shown as In development, from the registry",
     /STATUS_LABEL\[LINSPACE\.status\]/.test(src) && /status: "in-development"/.test(read("lib/site.ts")));
  ok("(N2) ...and stated in words, not only as a badge",
     /not available yet|in development and not available/i.test(all));
  const PROMISE =
    /coming soon|launch(es|ing|ed)?\b|available now|now available|beta\b|wait ?list|early access|sign[ -]?up|pre-?order|join the|notify me|release date (is|of)|\b20\d\d\b|Q[1-4]\b|₹|\bper (month|user|seat)\b|pricing|free trial/i;
  // Judged on the extracted strings AND on the comment-stripped source text:
  // the extractor reads text between tags, so a sentence that follows a JSX
  // expression ({LINSPACE.name} is ...) would otherwise go unjudged.
  const proseOf = (f) => strip(read(f)).replace(/className="[^"]*"/g, " ").replace(/<[^>]+>/g, " ");
  const promises = [
    ...text.filter((t) => PROMISE.test(t)),
    ...files.flatMap((f) => (proseOf(f).match(new RegExp(`.{0,40}(?:${PROMISE.source}).{0,40}`, "gi")) ?? [])
      .map((m) => `${f}: ${m.replace(/\s+/g, " ").trim()}`)),
  ];
  ok("(N3) no date, price, launch, beta or sign-up promise", promises.length === 0, promises.slice(0, 4).join("\n      "));
  ok("(N4) no form or input: there is no interest-collection workflow",
     !/<form\b|<input\b|<textarea\b|demo_requests|getSupabaseClient/.test(src));
  ok("(N5) the page is noindex",
     /robots:\s*\{\s*index: false/.test(read(LINSPACE_PAGE)));
  ok("(N6) ...and carries no product structured data",
     !/ld\+json|SoftwareApplication/.test(strip(read(LINSPACE_PAGE))));
  // The direction is described as what it is being designed around, never as
  // something the software does today.
  ok("(N7) the capabilities are framed as design direction, not shipped features",
     /being designed around/.test(all)
     && !/Linspace (reads|measures|generates|produces|creates|automates|extracts|calculates)/i.test(all));
  ok("(N8) no fake product interface or screenshot",
     !/<img\b|next\/image|Interactive example|dashboard/i.test(src));
}

/* ========================================================================= */
console.log(`\n${failures === 0 ? "PASS" : "FAIL"} ${checks - failures}/${checks}\n`);
process.exit(failures === 0 ? 0 : 1);
