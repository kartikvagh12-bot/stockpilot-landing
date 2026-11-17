import { MODEL_CATALOG, type ModelPrice } from "@/lib/assistant/runtime/models";

// Fail-closed configuration for the public assistant.
//
// The assistant is OFF unless every requirement below holds. When it is off,
// the endpoint answers 503 without calling a model, and the homepage renders
// no input at all. There is no partial mode.
//
// Production needs a second, separate switch (ASSISTANT_ALLOW_PRODUCTION) on
// top of ASSISTANT_ENABLED, so turning the assistant on for Preview can never
// switch it on for www.operza.in by accident.
//
// Environment variables (names only; none is a secret except the optional
// AI_GATEWAY_API_KEY, which is never read anywhere but the model call):
//
//   ASSISTANT_ENABLED              "true" to turn the assistant on
//   ASSISTANT_ALLOW_PRODUCTION     "true" additionally required in production
//   ASSISTANT_MODEL                one of MODEL_CATALOG's ids
//   ASSISTANT_RATE_LIMIT_ID        id of the per-visitor WAF rate-limit rule
//   ASSISTANT_GLOBAL_RATE_LIMIT_ID optional id of a site-wide rate-limit rule
//   ASSISTANT_BUDGET_CONFIRMED     "true" once an AI Gateway project budget is
//                                  set (the enforceable spend cap)
//   ASSISTANT_ALLOWED_ORIGINS      comma-separated extra allowed origins
//   ASSISTANT_ZERO_DATA_RETENTION  "true" to require ZDR providers per request
//   ASSISTANT_LOCAL_DEV            "true" for `next dev` only (see below)

export type AssistantConfig = {
  model: ModelPrice;
  rateLimitId: string | null;
  globalRateLimitId: string | null;
  allowedOrigins: ReadonlySet<string>;
  zeroDataRetention: boolean;
  /** Local development: no Vercel firewall or BotID exists, so the handler
   *  uses explicit development stubs. Never true on a deployment. */
  localDev: boolean;
};

export type ConfigResult =
  | { ok: true; config: AssistantConfig }
  | { ok: false; reasons: string[] };

type Env = Record<string, string | undefined>;

const ID = /^[A-Za-z0-9_-]{1,64}$/;

function origins(env: Env): Set<string> {
  const set = new Set<string>();
  for (const raw of (env.ASSISTANT_ALLOWED_ORIGINS ?? "").split(",")) {
    const o = raw.trim().replace(/\/$/, "");
    if (/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(o)) set.add(o.toLowerCase());
  }
  // The deployment's own URLs are always allowed, so a Preview works without
  // listing its generated hostname.
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host && /^[a-z0-9.-]+$/i.test(host)) set.add(`https://${host.toLowerCase()}`);
  }
  return set;
}

export function readAssistantConfig(env: Env = process.env): ConfigResult {
  const reasons: string[] = [];

  if (env.ASSISTANT_ENABLED !== "true") reasons.push("ASSISTANT_ENABLED is not true");

  const onVercel = env.VERCEL === "1";
  const localDev =
    !onVercel && env.NODE_ENV === "development" && env.ASSISTANT_LOCAL_DEV === "true";
  if (!onVercel && !localDev) reasons.push("not running on Vercel (and not explicit local development)");

  if (env.VERCEL_ENV === "production" && env.ASSISTANT_ALLOW_PRODUCTION !== "true")
    reasons.push("production requires ASSISTANT_ALLOW_PRODUCTION=true");

  const model = env.ASSISTANT_MODEL ? MODEL_CATALOG[env.ASSISTANT_MODEL] : undefined;
  if (!model) reasons.push("ASSISTANT_MODEL is missing or not an approved model id");

  const rateLimitId = env.ASSISTANT_RATE_LIMIT_ID?.trim() || null;
  if (!localDev && !(rateLimitId && ID.test(rateLimitId)))
    reasons.push("ASSISTANT_RATE_LIMIT_ID is missing or malformed");

  const globalRaw = env.ASSISTANT_GLOBAL_RATE_LIMIT_ID?.trim() || null;
  if (globalRaw && !ID.test(globalRaw)) reasons.push("ASSISTANT_GLOBAL_RATE_LIMIT_ID is malformed");

  if (env.ASSISTANT_BUDGET_CONFIRMED !== "true")
    reasons.push("ASSISTANT_BUDGET_CONFIRMED is not true (set an AI Gateway project budget first)");

  // Off Vercel there is no OIDC token, so a Gateway key is required.
  if (!onVercel && !env.AI_GATEWAY_API_KEY) reasons.push("AI_GATEWAY_API_KEY is required outside Vercel");

  const allowedOrigins = origins(env);
  if (localDev) allowedOrigins.add("http://localhost:3000");
  if (allowedOrigins.size === 0) reasons.push("no allowed origins");

  if (reasons.length > 0 || !model) return { ok: false, reasons };
  return {
    ok: true,
    config: {
      model,
      rateLimitId,
      globalRateLimitId: globalRaw,
      allowedOrigins,
      zeroDataRetention: env.ASSISTANT_ZERO_DATA_RETENTION === "true",
      localDev,
    },
  };
}

/** Whether the homepage may render the assistant input at all. */
export function isAssistantAvailable(env: Env = process.env): boolean {
  return readAssistantConfig(env).ok;
}
