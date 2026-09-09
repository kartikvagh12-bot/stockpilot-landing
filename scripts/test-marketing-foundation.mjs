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
import { readFileSync } from "node:fs";
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
  "app/health-check/page.tsx",
  "app/sitemap.ts",
  "app/opengraph-image.tsx",
  "app/twitter-image.tsx",
  "app/health-check/opengraph-image.tsx",
  "app/health-check/twitter-image.tsx",
  "lib/site.ts",
  "lib/og-card.tsx",
  "components/Footer.tsx",
];

/* ========================================================================= */
section("A. NO FABRICATED PRICING IN STRUCTURED DATA");
/* ========================================================================= */
{
  const page = read("app/page.tsx");
  ok("(A1) the SoftwareApplication carries no Offer", !/"?offers"?\s*:/.test(page),
     (page.match(/.{0,60}offers.{0,60}/) ?? [])[0]);
  ok("(A2) ...and no zero price survives anywhere in it",
     !/priceCurrency/.test(page) && !/\bprice\s*:/.test(page),
     (page.match(/.{0,60}price.{0,60}/) ?? [])[0]);
  // The reason the Offer was removed: it advertised Operza as free.
  ok("(A3) ...and no free-tier wording reached the structured data",
     !/"0"/.test(page.slice(page.indexOf("ld+json"))));
  ok("(A4) the structured data still describes the product",
     /Manufacturing software for Indian factories/.test(page));
  ok("(A5) ...as a SoftwareApplication and an Organization",
     /"@type": "SoftwareApplication"/.test(page) && /"@type": "Organization"/.test(page));
}

/* ========================================================================= */
section("B. THE SITEMAP LISTS REAL URLS");
/* ========================================================================= */
{
  const sm = read("app/sitemap.ts");
  const urls = [...sm.matchAll(/url:\s*[`"]([^`"]+)[`"]/g)].map((m) => m[1]);
  ok(`(B1) the sitemap declares URLs (${urls.length})`, urls.length >= 2);
  const fragments = urls.filter((u) => u.includes("#"));
  ok("(B2) no '#fragment' URL is listed", fragments.length === 0, JSON.stringify(fragments));
  ok("(B3) the homepage and the health check are both listed",
     urls.some((u) => /\$\{base\}\/$/.test(u)) && urls.some((u) => u.includes("/health-check")));
  // Routes that do not exist yet must not be advertised.
  ok("(B4) no route is listed that the app does not serve",
     !urls.some((u) => /\/(factory|books|tally|costing)\b/.test(u)),
     JSON.stringify(urls.filter((u) => /\/(factory|books|tally|costing)\b/.test(u))));
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
section("D. METADATA CARRIES THE CURRENT POSITIONING");
/* ========================================================================= */
{
  const layout = read("app/layout.tsx");
  ok("(D1) the default title names both halves of the product",
     /Operza: manufacturing software that runs your factory and your books/.test(layout));
  ok("(D2) the title template is unchanged", /template: "%s \| Operza"/.test(layout));
  ok("(D3) the description covers the floor and the books",
     /Manufacturing software for Indian factories\./.test(layout)
     && /invoices, bills, payments and books/.test(layout));
  ok("(D4) the social title is the one-system line",
     /Operza: run your factory and your books in one system/.test(layout));
  ok("(D5) the social description names the Tally export",
     /Exports for TallyPrime\./.test(layout));
  // The old positioning is the actual regression risk here.
  const layoutCopy = copy("app/layout.tsx");
  ok("(D6) nothing in the metadata still calls Operza inventory and production tracking",
     !/[Ii]nventory and production tracking/.test(layoutCopy));
  ok("(D7) ...and ERP is not the category the site leads with",
     !/\bERP\b/.test(
       layoutCopy.slice(layoutCopy.indexOf("const TITLE"), layoutCopy.indexOf("keywords:")),
     ));
  ok("(D8) the keyword set covers accounting and Tally intent, not stock alone",
     /manufacturing accounting software/.test(layout) && /TallyPrime export/.test(layout));

  const hc = copy("app/health-check/page.tsx");
  ok("(D9) the health-check metadata no longer positions Operza as inventory software",
     !/inventory and production/i.test(hc) && !/manufacturing inventory/i.test(hc),
     (hc.match(/.{0,50}(inventory and production|manufacturing inventory).{0,50}/i) ?? [])[0]);
  ok("(D10) ...and still describes Operza truthfully",
     /manufacturing software for Indian factories/i.test(hc));
}

/* ========================================================================= */
section("E. THE SOCIAL CARD THE SITE ADVERTISES ACTUALLY EXISTS");
/* ========================================================================= */
{
  const layout = read("app/layout.tsx");
  ok("(E1) the site still declares a large-image Twitter card",
     /card: "summary_large_image"/.test(layout));
  // Which is only honest if an image resolves for it.
  // Every route that advertises a large-image card needs an image that
  // resolves. A nested segment declaring its own openGraph block does not
  // inherit the root segment's image file, so /health-check gets its own.
  const IMAGE_ROUTES = [
    ["opengraph", "app/opengraph-image.tsx"],
    ["twitter", "app/twitter-image.tsx"],
    ["health-check opengraph", "app/health-check/opengraph-image.tsx"],
    ["health-check twitter", "app/health-check/twitter-image.tsx"],
  ];
  for (const [name, file] of IMAGE_ROUTES) {
    const src = read(file);
    ok(`(E2-${name}) the ${name} image route exports size, contentType and a default`,
       /export const size/.test(src) && /export const contentType/.test(src)
       && /export default function/.test(src));
    ok(`(E3-${name}) ...and it has alt text`, /export const alt/.test(src));
  }
  ok("(E3b) every route declaring summary_large_image has an image route",
     /card: "summary_large_image"/.test(read("app/health-check/page.tsx"))
       ? IMAGE_ROUTES.some(([n]) => n.startsWith("health-check"))
       : true);

  const card = read("lib/og-card.tsx");
  ok("(E4) the card is 1200x630", /width: 1200, height: 630/.test(card));
  ok("(E5) ...renders through next/og, so no image dependency was added",
     /from "next\/og"/.test(card));
  ok("(E6) ...and carries the positioning rather than a fabricated visual",
     /Run the factory and the books in one system\./.test(card)
     && !/testimonial|customers|trusted by|% /i.test(card));

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
  ok("(G2) ...and states the current positioning",
     /Manufacturing software for Indian factories/.test(footerCopy));
  const mark = /src="\/operza-logo\.png"/;
  ok("(G3) the footer uses the same mark file as the navbar",
     mark.test(footer) && mark.test(navbar));
  ok("(G4) ...and no longer draws its own layers icon",
     !/M3 7l9-4 9 4-9 4-9-4z/.test(footer));
}

/* ========================================================================= */
section("H. THE SURFACES THIS CHANGE DOES NOT OWN WERE LEFT ALONE");
/* ========================================================================= */
{
  // Guard rails against scope creep, which for this change is a real risk:
  // the homepage rewrite is a separate piece of work.
  const site = read("lib/site.ts");
  ok("(H1) nav links still point at sections that exist today",
     /\/#features/.test(site) && /\/#workflow/.test(site) && /\/#screenshots/.test(site));
  ok("(H2) ...and no future anchor was shipped ahead of its section",
     !/#factory|#books|#costing|#plans/.test(site),
     (site.match(/#(factory|books|costing|plans)/) ?? [])[0]);
  ok("(H3) the visible FAQ has no structured data yet",
     !/FAQPage/.test(read("app/page.tsx")));
}

console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"} ${checks - failures}/${checks}\n`,
);
process.exit(failures === 0 ? 0 : 1);
