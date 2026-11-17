// ---------------------------------------------------------------------------
// ASSISTANT SOURCE VERIFIER
//
// Proves every citation in the assistant's knowledge base. For each source
// reference it reads the cited file and checks that the anchor text is in it:
//
//   operza-app refs        read with `git show <pinned commit>:<path>` from a
//                          local checkout named by OPERZA_APP_DIR, so the
//                          check is against exactly the pinned commit even if
//                          the checkout has moved on.
//   stockpilot-landing and
//   decision refs          read from this repository's working tree.
//
// Anchors are compared with whitespace collapsed, so an anchor may span a
// line wrap in JSX or Markdown, but every word must match exactly.
//
//   OPERZA_APP_DIR=/path/to/operza-app npm run verify:assistant-sources
//
// Without OPERZA_APP_DIR the operza-app refs are reported as skipped and the
// script exits non-zero, so it can never pass by accident. The offline test
// (npm run test:assistant) checks the local refs on every run.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { KNOWLEDGE } = await import("../lib/assistant/knowledge.ts");
const { PRODUCT_SOURCE } = await import("../lib/assistant/sources.ts");

const squash = (t) => t.replace(/\s+/g, " ");
const APP = process.env.OPERZA_APP_DIR;
const cache = new Map();

function readAt(ref) {
  const key = `${ref.repo}:${ref.path}`;
  if (cache.has(key)) return cache.get(key);
  let text = null;
  if (ref.repo === "operza-app") {
    if (!APP) return null;
    try {
      text = execFileSync("git", ["-C", APP, "show", `${PRODUCT_SOURCE.commit}:${ref.path}`], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      text = "";
    }
  } else {
    const file = join(ROOT, ref.path.split("#")[0]);
    text = existsSync(file) ? readFileSync(file, "utf8") : "";
  }
  const value = squash(text);
  cache.set(key, value);
  return value;
}

let ok = 0;
let failed = 0;
let skipped = 0;
for (const entry of KNOWLEDGE) {
  for (const ref of entry.sources) {
    const text = readAt(ref);
    if (text === null) {
      skipped++;
      continue;
    }
    if (text === "") {
      failed++;
      console.log(`  ✗ ${entry.id}: ${ref.repo}:${ref.path} does not exist at the pinned commit`);
    } else if (!text.includes(squash(ref.anchor))) {
      failed++;
      console.log(`  ✗ ${entry.id}: anchor not found in ${ref.repo}:${ref.path}\n      "${ref.anchor}"`);
    } else {
      ok++;
    }
  }
}

if (APP) {
  const head = execFileSync("git", ["-C", APP, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  console.log(`\noperza-app checkout at ${head.slice(0, 7)}; refs read at pinned ${PRODUCT_SOURCE.commit.slice(0, 7)}`);
}
console.log(`${ok} citations verified, ${failed} failed, ${skipped} skipped${skipped ? " (set OPERZA_APP_DIR to check them)" : ""}`);
process.exit(failed === 0 && skipped === 0 ? 0 : 1);
