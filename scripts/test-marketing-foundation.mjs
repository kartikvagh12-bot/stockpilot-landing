// ---------------------------------------------------------------------------
// MARKETING FOUNDATION GUARD
//
// A static check over a NARROW, deliberately chosen surface: the files the
// marketing-foundation change actually rewrote. It exists to stop a specific
// set of regressions coming back, not to police the whole site.
//
// It reads files. It does not build, render, or make network calls.
//
// Scope note: the homepage sections and the health check still carry the older
// copy, em dashes included, and that is expected until those surfaces are
// rewritten. A guard that covered them today would need a whitelist of ~70
// existing occurrences, which would be worse than no guard: the whitelist
// becomes the thing people maintain, and it silently blesses new debt that
// happens to look like old debt. The broader copy guard ships with the
// homepage rewrite instead.
// ---------------------------------------------------------------------------
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

let checks = 0;
let failures = 0;
const ok = (label, cond, detail = "") => {
  checks++;
  if (!cond) failures++;
  console.log(`  ${cond ? "✓" : "✗"} ${label}${!cond && detail ? `\n      ${detail}` : ""}`);
};
const section = (t) => console.log(`\n---- ${t} ----`);

const EM_DASH = "\u2014";

/** Comments are not copy. A note explaining WHY a phrase was removed must not
 *  itself trip the check that removed it. Only the em-dash rule below reads
 *  raw source, because these files were written fresh and hold to it whole. */
const stripComments = (t) =>
  t
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, " ")
    .split("\n")
    .map((l) => (/^\s*\/\//.test(l) ? "" : l))
    .join("\n");
const copy = (f) => stripComments(read(f));

/** The files this guard owns. Every one was rewritten by the foundation
 *  change, so each is held to the full standard rather than a partial one. */
const COVERED = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/shift/page.tsx",
  "app/linspace/page.tsx",
  "app/health-check/page.tsx",
  "app/sitemap.ts",
  "app/opengraph-image.tsx",
  "app/twitter-image.tsx",
  "app/shift/opengraph-image.tsx",
  "app/shift/twitter-image.tsx",
  "app/linspace/opengraph-image.tsx",
  "app/linspace/twitter-image.tsx",
  "app/health-check/opengraph-image.tsx",
  "app/health-check/twitter-image.tsx",
  "lib/site.ts",
  "lib/og-card.tsx",
  "components/Footer.tsx",
  "components/Navbar.tsx",
];

const HOME = "app/page.tsx";
const SHIFT_PAGE = "app/shift/page.tsx";
const LINSPACE_PAGE = "app/linspace/page.tsx";

/* ========================================================================= */
section("A. NO FABRICATED PRICING IN STRUCTURED DATA");
/* ========================================================================= */
{
  // Since the multi-product cutover the manufacturing SoftwareApplication is
  // on /shift and the homepage carries the company. Neither may carry an
  // Offer: the reason it was removed is that it advertised Operza as free.
  for (const f of [HOME, SHIFT_PAGE, LINSPACE_PAGE]) {
    const page = read(f);
    ok(`(A1-${f}) no Offer in the structured data`, !/"?offers"?\s*:/.test(page),
       (page.match(/.{0,60}offers.{0,60}/) ?? [])[0]);
    ok(`(A2-${f}) ...and no price anywhere in it`,
       !/priceCurrency/.test(page) && !/\bprice\s*:/.test(page),
       (page.match(/.{0,60}price.{0,60}/) ?? [])[0]);
    const ld = page.indexOf("ld+json") < 0 ? "" : page.slice(page.indexOf("ld+json"));
    ok(`(A3-${f}) ...and no free-tier wording reached it`, !/"0"/.test(ld));
  }
  const shift = read(SHIFT_PAGE);
  ok("(A4) the Shift structured data still describes the product",
     /Manufacturing software for Indian factories/.test(shift));
  ok("(A5) the SoftwareApplication is on /shift and the Organization on the homepage",
     /"@type": "SoftwareApplication"/.test(shift) && /"@type": "Organization"/.test(read(HOME)));
  ok("(A6) ...and no other page claims a SoftwareApplication",
     !/"@type": "SoftwareApplication"/.test(read(HOME)) && !/"@type": "SoftwareApplication"/.test(read(LINSPACE_PAGE)));
}

/* ========================================================================= */
section("B. THE SITEMAP LISTS REAL URLS");
/* ========================================================================= */
{
  const sm = read("app/sitemap.ts");
  const urls = [...sm.matchAll(/url:\s*[`"]([^`"]+)[`"]/g)].map((m) => m[1]);
  ok(`(B1) the sitemap declares URLs (${urls.length})`, urls.length >= 3);
  const fragments = urls.filter((u) => u.includes("#"));
  ok("(B2) no '#fragment' URL is listed", fragments.length === 0, JSON.stringify(fragments));
  ok("(B3) the homepage, Operza Shift and the Health Check are listed",
     urls.some((u) => /\$\{base\}\/$/.test(u)) && urls.some((u) => /\/shift$/.test(u))
     && urls.some((u) => u.includes("/health-check")));
  // Routes that do not exist must not be advertised.
  ok("(B4) no route is listed that the app does not serve",
     !urls.some((u) => /\/(factory|books|tally|costing)\b/.test(u)),
     JSON.stringify(urls.filter((u) => /\/(factory|books|tally|costing)\b/.test(u))));
  // A page that asks not to be indexed has no place in the sitemap.
  ok("(B5) the noindex Linspace page is not listed",
     /index: false/.test(read(LINSPACE_PAGE)) && !urls.some((u) => u.includes("/linspace")));
}

/* ========================================================================= */
section("C. THE RETIRED STREAMLIT DEPLOY IS GONE");
/* ========================================================================= */
{
  const site = read("lib/site.ts");
  ok("(C1) lib/site.ts has no appLegacy constant", !/appLegacy/.test(site));
  ok("(C2) ...and no reference to the Streamlit deploy", !/streamlit/i.test(site));
  ok("(C3) the primary app URL is unchanged", /app:\s*"https:\/\/app\.operza\.in"/.test(site));
  // Removing the constant is only safe if nothing still reads it.
  for (const f of COVERED)
    ok(`(C4-${f}) ...and nothing in the covered surface still reads it`,
       !/appLegacy/.test(read(f)));
}

/* ========================================================================= */
section("D. EACH PAGE'S METADATA CARRIES ITS OWN POSITIONING");
/* ========================================================================= */
{
  // The root layout carries the company defaults (Operza is the parent
  // brand). The manufacturing positioning moved to /shift whole.
  const layout = read("app/layout.tsx");
  ok("(D1) the default title is the company's",
     /const TITLE = "Operza: software for complex work";/.test(layout));
  ok("(D2) the title template is unchanged", /template: "%s \| Operza"/.test(layout));
  ok("(D3) the default description names both products and Linspace's status",
     /Operza builds software for complex business workflows\./.test(layout)
     && /Operza Shift/.test(layout) && /Operza Linspace, for construction, is in development/.test(layout));
  ok("(D3b) the company social line is the Founder's headline",
     /Complex work\. Clearer possibilities\./.test(layout));

  const shift = read(SHIFT_PAGE);
  ok("(D4) Operza Shift's title names both halves of the product",
     /Operza Shift: manufacturing software that runs your factory and your books/.test(shift));
  ok("(D5) ...its description covers the floor and the books",
     /Manufacturing software for Indian factories\./.test(shift)
     && /invoices, bills, payments and books/.test(shift));
  ok("(D5b) ...its social title is the one-system line",
     /Operza Shift: run your factory and your books in one system/.test(shift));
  ok("(D5c) ...its social description names the Tally export",
     /Exports for TallyPrime\./.test(shift));
  ok("(D5d) ...its keywords cover accounting and Tally intent, not stock alone",
     /manufacturing accounting software/.test(shift) && /TallyPrime export/.test(shift));
  ok("(D5e) ...and it declares its own canonical URL",
     /alternates: \{ canonical: URL \}/.test(shift) && /\$\{SITE\.domain\}\$\{SHIFT\.path\}/.test(shift));

  // The old positioning is the actual regression risk here.
  for (const f of ["app/layout.tsx", SHIFT_PAGE]) {
    const c = copy(f);
    ok(`(D6-${f}) nothing calls Operza inventory and production tracking`,
       !/[Ii]nventory and production tracking/.test(c));
    ok(`(D7-${f}) ...and ERP is not the category it leads with`, !/\bERP\b/.test(c));
  }

  const lin = read(LINSPACE_PAGE);
  ok("(D8) Linspace's metadata says in development and asks not to be indexed",
     /in development/i.test(lin) && /robots:\s*\{\s*index: false/.test(lin)
     && /alternates: \{ canonical: URL \}/.test(lin));

  const hc = copy("app/health-check/page.tsx");
  ok("(D9) the health-check metadata no longer positions Operza as inventory software",
     !/inventory and production/i.test(hc) && !/manufacturing inventory/i.test(hc),
     (hc.match(/.{0,50}(inventory and production|manufacturing inventory).{0,50}/i) ?? [])[0]);
  ok("(D10) ...and describes what the assessment actually checks",
     /materials, production and finished-goods records/i.test(hc)
     && /Eight questions, no signup/i.test(hc));
}

/* ========================================================================= */
section("E. THE SOCIAL CARD EACH ROUTE ADVERTISES ACTUALLY EXISTS");
/* ========================================================================= */
{
  const layout = read("app/layout.tsx");
  ok("(E1) the site still declares a large-image Twitter card",
     /card: "summary_large_image"/.test(layout));
  // A nested segment declaring its own openGraph block does not inherit the
  // root segment's image file, so every such route carries its own.
  const ROUTES = [
    ["root", "app", "company"],
    ["shift", "app/shift", "shift"],
    ["linspace", "app/linspace", "linspace"],
    ["health-check", "app/health-check", "shift"],
  ];
  for (const [name, dir, card] of ROUTES) {
    for (const kind of ["opengraph", "twitter"]) {
      const src = read(`${dir}/${kind}-image.tsx`);
      ok(`(E2-${name}-${kind}) exports size, contentType and a default`,
         /export const size/.test(src) && /export const contentType/.test(src)
         && /export default function/.test(src));
      ok(`(E3-${name}-${kind}) ...renders the ${card} card with its alt text`,
         new RegExp(`export const alt = CARDS\\.${card}\\.alt;`).test(src)
         && new RegExp(`renderOgCard\\(CARDS\\.${card}\\)`).test(src));
    }
  }
  ok("(E3b) every page declaring summary_large_image has image routes",
     [["app/health-check/page.tsx", "app/health-check"], [SHIFT_PAGE, "app/shift"], [LINSPACE_PAGE, "app/linspace"]]
       .every(([page, dir]) => !/card: "summary_large_image"/.test(read(page))
         || (read(`${dir}/opengraph-image.tsx`) && read(`${dir}/twitter-image.tsx`))));

  const card = read("lib/og-card.tsx");
  ok("(E4) the card is 1200x630", /width: 1200, height: 630/.test(card));
  ok("(E5) ...renders through next/og, so no image dependency was added",
     /from "next\/og"/.test(card));
  ok("(E6) ...carries each audience's line rather than a fabricated visual",
     /title: "Complex work\. Clearer possibilities\."/.test(card)
     && /title: "Run the factory and the books in one system\."/.test(card)
     && /eyebrow: "Operza Linspace: in development"/.test(card)
     && !/testimonial|customers|trusted by|% /i.test(card));
  ok("(E6b) ...and its accent is Operza red, not the retired blue",
     /const BRAND = "#f31820";/.test(card) && !/#3f63f7/i.test(card));

  const pkg = JSON.parse(read("package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const banned of ["@vercel/og", "satori", "sharp", "canvas", "puppeteer"])
    ok(`(E7-${banned}) no image-generation dependency was added (${banned})`, !(banned in deps));
}

/* ========================================================================= */
section("F. NO EM DASH IN THE COPY THIS CHANGE OWNS");
/* ========================================================================= */
{
  for (const f of COVERED) {
    const src = read(f);
    const hits = src.split("\n")
      .map((line, i) => [i + 1, line])
      .filter(([, line]) => line.includes(EM_DASH));
    ok(`(F1-${f}) contains no em dash`, hits.length === 0,
       hits.slice(0, 3).map(([n, l]) => `${f}:${n} ${l.trim().slice(0, 80)}`).join("\n      "));
  }
}

/* ========================================================================= */
section("G. THE FOOTER TELLS THE TRUTH AND USES ONE MARK");
/* ========================================================================= */
{
  const footer = read("components/Footer.tsx");
  const footerCopy = copy("components/Footer.tsx");
  const navbar = read("components/Navbar.tsx");
  ok("(G1) the footer no longer calls Operza inventory and production tracking",
     !/[Ii]nventory and production tracking/.test(footerCopy));
  ok("(G2) ...and describes the company, with both products",
     /Operza builds software for complex business workflows/.test(footerCopy)
     && /PRODUCTS\.map/.test(footer));
  const mark = /src="\/operza-logo\.png"/;
  ok("(G3) the footer uses the same mark file as the navbar",
     mark.test(footer) && mark.test(navbar));
  ok("(G4) ...and no longer draws its own layers icon",
     !/M3 7l9-4 9 4-9 4-9-4z/.test(footer));
  ok("(G5) ...and links no legal page that does not exist",
     !/\/(privacy|terms|legal|cookies)\b/.test(footer));
}

/* ========================================================================= */
section("H. NAVIGATION AND THE FOUNDATION AGREE");
/* ========================================================================= */
{
  // The navbar's product links come from the registry; its text links are
  // NAV_LINKS. Anchor-to-section resolution lives in the copy guard (F), and
  // route resolution in section J below.
  const site = read("lib/site.ts");
  const navbar = read("components/Navbar.tsx");
  ok("(H1) nav text links point at the company section and the Health Check",
     /\{ href: "\/#company", label: "Company" \}/.test(site)
     && /\{ href: "\/health-check", label: "Health Check" \}/.test(site));
  ok("(H2) ...and no retired anchor survives in the nav",
     !/#features|#workflow|#screenshots/.test(site),
     (site.match(/#(features|workflow|screenshots)/) ?? [])[0]);
  ok("(H2b) the Products menu is built from the registry, not hard-coded",
     /PRODUCTS\.map/.test(navbar) && !/href="\/(shift|linspace)"/.test(navbar));
  ok("(H2c) ...and it is a click disclosure, not hover-only, and closes on Escape",
     /aria-expanded=\{open\}/.test(navbar) && /onClick=\{\(\) => setOpen\(\(v\) => !v\)\}/.test(navbar)
     && /e\.key === "Escape"/.test(navbar) && !/onMouseEnter|onMouseOver/.test(navbar));
  const shift = read(SHIFT_PAGE);
  ok("(H3) the FAQ structured data ships on /shift, generated from the visible FAQ",
     /faqJsonLd\(\)/.test(shift) && !/acceptedAnswer/.test(shift) && !/faqJsonLd/.test(read(HOME)));
  ok("(H4) ...so no page hand-writes a second copy of an answer",
     ![HOME, SHIFT_PAGE, LINSPACE_PAGE].some((f) => /"@type": "Question"/.test(read(f))));
}

/* ========================================================================= */
section("I. THE BRAND, THE PRODUCTS AND THE LEGAL ENTITY ARE NAMED SEPARATELY");
/* ========================================================================= */
{
  // Founder direction (2026-11-17): Operza is the public brand and the parent
  // of its products. Operza Technologies Private Limited is the registered
  // company, named in legal contexts only, from one constant.
  const LEGAL = "Operza Technologies Private Limited";
  const site = copy("lib/site.ts");
  const footer = copy("components/Footer.tsx");

  ok("(I1) SITE.name is exactly the public brand",
     /\bname:\s*"Operza",/.test(site), (site.match(/\bname:\s*"[^"]*"/) ?? [])[0]);
  ok("(I2) SITE.legalName is exactly the company name",
     site.includes(`legalName: "${LEGAL}",`));

  // The old line made Operza sound like a mere product of the longer-named
  // company. The registered name now appears once, in the legal line.
  ok("(I3) the footer no longer says Operza is a product of the company",
     !/is a product of/.test(footer));
  ok("(I4) the copyright names the company from SITE.legalName and reserves rights",
     /©\s*\{new Date\(\)\.getFullYear\(\)\}\s*\{SITE\.legalName\}\.\s*All rights reserved\./.test(footer));
  ok("(I4b) ...and that is the footer's only use of the legal name",
     (footer.match(/SITE\.legalName/g) ?? []).length === 1);

  const block = (src, type) => {
    const ld = src.slice(src.indexOf("ld+json"));
    const at = ld.indexOf(`"@type": "${type}"`);
    return at < 0 ? "" : ld.slice(at, ld.indexOf("}", at));
  };
  const org = block(copy(HOME), "Organization");
  const app = block(copy(SHIFT_PAGE), "SoftwareApplication");
  ok("(I5) the SoftwareApplication is Operza Shift, named from the registry",
     /\bname:\s*SHIFT\.name,/.test(app) && !/legalName/.test(app), app.slice(0, 160));
  ok("(I6) the Organization is the public brand, with the registered name as legalName",
     /\bname:\s*SITE\.name,/.test(org) && /\blegalName:\s*SITE\.legalName,/.test(org), org.slice(0, 200));

  // One source of truth: the literal legal name appears only in lib/site.ts.
  const literal = COVERED.filter((f) => f !== "lib/site.ts" && copy(f).includes(LEGAL));
  ok("(I7) no second hard-coded copy of the legal name", literal.length === 0, literal.join(", "));
}

/* ========================================================================= */
section("J. THE PRODUCT REGISTRY IS TRUTHFUL AND NOTHING LINKS TO A MISSING PAGE");
/* ========================================================================= */
{
  // Founder direction (2026-11-17): Operza is the parent brand of Operza Shift
  // (live software) and Operza Linspace (in development). lib/site.ts names
  // them once. The registry may describe a planned page, but it must not claim
  // a page that does not exist, and nothing may link to a page before it does.
  const site = copy("lib/site.ts");
  const block = (site.match(/export const PRODUCTS = \[([\s\S]*?)\] as const/) ?? [, ""])[1];
  const products = [...block.matchAll(
    /id:\s*"([a-z-]+)",\s*name:\s*"([^"]+)",\s*path:\s*"([^"]+)",\s*pageLive:\s*(true|false),\s*status:\s*"([^"]+)"/g,
  )].map(([, id, name, path, pageLive, status]) => ({ id, name, path, pageLive: pageLive === "true", status }));
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const pageExists = (path) =>
    path === "/" || existsSync(join(ROOT, "app", ...path.slice(1).split("/"), "page.tsx"));

  ok(`(J1) the registry declares exactly the approved products (${products.length})`,
     products.length === 2 && byId.shift && byId.linspace,
     JSON.stringify(products));
  ok("(J2) Operza Shift is named and pathed as approved",
     byId.shift?.name === "Operza Shift" && byId.shift?.path === "/shift"
     && byId.shift?.status === "available");
  ok("(J3) Operza Linspace is named as approved and marked in development, not launched",
     byId.linspace?.name === "Operza Linspace" && byId.linspace?.path === "/linspace"
     && byId.linspace?.status === "in-development");
  for (const p of products)
    ok(`(J4-${p.id}) pageLive (${p.pageLive}) matches whether ${p.path} has a page`,
       p.pageLive === pageExists(p.path));
  ok("(J5) the registry carries no plans, features or capabilities (operza-app owns those)",
     !/\b(plans|features|capabilities|includes)\s*:/.test(block)
     && !/"[^"]*\b(Factory|Books|Complete)\b[^"]*"/.test(block),
     block.slice(0, 200));

  // Every internal link on the site, whether a JSX attribute or declared as
  // data, must resolve to a page that exists. Fragments and query strings are
  // judged by the page they sit on; anchors are the copy guard's job (F).
  const walk = (dir) =>
    readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? walk(`${dir}/${e.name}`)
        : /\.(tsx?|mjs)$/.test(e.name) ? [`${dir}/${e.name}`] : []);
  const sources = ["app", "components", "lib"].flatMap(walk);
  const links = sources.flatMap((f) =>
    [...copy(f).matchAll(/href(?:=|:\s*)\{?"(\/[^"]*)"/g)].map((m) => ({ f, href: m[1] })));
  ok(`(J6) internal links were actually collected (${links.length})`, links.length >= 10);
  // A path with a file extension is a static asset and must exist in public/.
  const resolves = (href) => {
    const path = href.split(/[#?]/)[0].replace(/\/$/, "") || "/";
    return /\.[a-z0-9]+$/i.test(path)
      ? existsSync(join(ROOT, "public", ...path.slice(1).split("/")))
      : pageExists(path);
  };
  const broken = links.filter(({ href }) => !resolves(href));
  ok("(J7) every internal link resolves to an existing page or public asset",
     broken.length === 0, broken.map(({ f, href }) => `${f}: ${href}`).join("\n      "));
  const planned = products.filter((p) => !p.pageLive).map((p) => p.path);
  const early = links.filter(({ href }) =>
    planned.some((p) => href === p || href.startsWith(`${p}/`) || href.startsWith(`${p}#`)));
  ok("(J8) nothing links to a product page that is not live yet",
     early.length === 0, early.map(({ f, href }) => `${f}: ${href}`).join("\n      "));
  const sitemap = copy("app/sitemap.ts");
  ok("(J9) the sitemap lists no product page that is not live yet",
     !planned.some((p) => sitemap.includes(`\${base}${p}`)));
}

console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"} ${checks - failures}/${checks}\n`,
);
process.exit(failures === 0 ? 0 : 1);
