// Lets the offline test scripts import the site's TypeScript modules exactly
// as Next.js does: the "@/" alias resolves to the repository root, and an
// extensionless import resolves to the .ts or .tsx file beside it. Node 22
// strips the types itself, so nothing is compiled and no dependency is added.
//
// Usage:  node --import ./scripts/lib/ts-resolve.mjs scripts/<test>.mjs
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "../..");

const hooks = `
const ROOT = ${JSON.stringify(ROOT)};
const { existsSync } = await import("node:fs");
const { pathToFileURL, fileURLToPath } = await import("node:url");
const { join, dirname } = await import("node:path");
const withExt = (base) => {
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
    if (existsSync(base + ext) && (ext !== "" || /\\.(t|j)sx?$|\\.mjs$/.test(base))) return base + ext;
  }
  return null;
};
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const hit = withExt(join(ROOT, specifier.slice(2)));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const hit = withExt(join(dirname(fileURLToPath(context.parentURL)), specifier));
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return next(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(hooks)}`, pathToFileURL("./"));
