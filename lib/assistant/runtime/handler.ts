import type { ConfigResult } from "@/lib/assistant/runtime/config";
import { LIMITS } from "@/lib/assistant/runtime/limits";
import { buildSystemPrompt } from "@/lib/assistant/runtime/prompt";
import { validateConversation, type ChatMessage } from "@/lib/assistant/runtime/validate";

// The public assistant endpoint's request handling, independent of any SDK.
//
// Every external effect is injected (configuration, bot check, rate limiter,
// the model stream, logging), so the security behaviour below can be tested
// offline with fakes and no paid call. app/api/assistant/route.ts wires the
// real implementations.
//
// Order of checks, each failing closed before any model is called:
//   method -> configuration -> origin -> content type -> body size
//   -> bot check -> per-visitor rate limit -> optional site-wide rate limit
//   -> conversation validation -> model (with output cap and timeouts)
//
// Privacy: nothing a visitor writes is logged. Logs carry only an event name,
// a status code and coarse numbers; never message text, IP addresses or user
// agents.

export type GenerateArgs = {
  model: string;
  instructions: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
  firstTokenTimeoutMs: number;
  abortSignal: AbortSignal;
  zeroDataRetention: boolean;
};

export type RateLimitCheck = (
  id: string,
  options: { request: Request; rateLimitKey?: string; timeout: number },
) => Promise<{ rateLimited: boolean; error?: string }>;

export type HandlerDeps = {
  readConfig: () => ConfigResult;
  checkBot: () => Promise<{ isBot: boolean }>;
  checkRateLimit: RateLimitCheck;
  /** Yields text chunks. Throws (or yields nothing and throws) on failure. */
  generate: (args: GenerateArgs) => AsyncIterable<string>;
  log: (event: string, fields?: Record<string, string | number | boolean>) => void;
};

/** Marks a stream that ended early. The browser strips it and shows a retry. */
export const STREAM_ERROR_MARKER = "\u001Eerror";

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
} as const;

function json(status: number, error: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS, ...extra },
  });
}

/** Map a model or gateway failure to what the visitor is told. */
export function classifyModelError(err: unknown): { status: number; error: string } {
  const e = err as { statusCode?: number; name?: string } | undefined;
  const status = typeof e?.statusCode === "number" ? e.statusCode : undefined;
  if (e?.name === "AbortError" || e?.name === "TimeoutError" || status === 408 || e?.name === "GatewayTimeoutError")
    return { status: 504, error: "timeout" };
  // 402: budget exhausted or no credit. 401/403: credentials, eligibility or
  // ZDR. 429: the provider or Gateway is throttling. None is the visitor's
  // fault, and none should be retried automatically.
  if (status === 402 || status === 401 || status === 403 || status === 429) return { status: 503, error: "unavailable" };
  return { status: 502, error: "model_error" };
}

async function readCappedBody(request: Request, max: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(all);
}

export function createAssistantHandler(deps: HandlerDeps) {
  return async function handle(request: Request): Promise<Response> {
    const started = Date.now();
    const done = (status: number, event: string, extra: Record<string, string | number | boolean> = {}) =>
      deps.log(event, { status, ms: Date.now() - started, ...extra });

    if (request.method !== "POST") {
      done(405, "assistant.method");
      return json(405, "method_not_allowed", { Allow: "POST" });
    }

    const cfg = deps.readConfig();
    if (!cfg.ok) {
      // The reasons stay on the server; the visitor only learns it is off.
      done(503, "assistant.disabled", { reasons: cfg.reasons.length });
      return json(503, "unavailable");
    }
    const config = cfg.config;

    // Only this website may call the endpoint from a browser.
    const origin = request.headers.get("origin")?.toLowerCase().replace(/\/$/, "");
    const fetchSite = request.headers.get("sec-fetch-site");
    if (!origin || !config.allowedOrigins.has(origin) || (fetchSite && fetchSite !== "same-origin")) {
      done(403, "assistant.origin");
      return json(403, "forbidden");
    }

    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
      done(415, "assistant.content_type");
      return json(415, "unsupported_media_type");
    }

    const declared = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declared) && declared > LIMITS.maxBodyBytes) {
      done(413, "assistant.too_large");
      return json(413, "too_large");
    }

    if (!config.localDev) {
      try {
        const bot = await deps.checkBot();
        if (bot.isBot) {
          done(403, "assistant.bot");
          return json(403, "forbidden");
        }
      } catch {
        done(503, "assistant.bot_check_failed");
        return json(503, "unavailable");
      }

      const limits: Array<{ id: string; key?: string }> = [{ id: config.rateLimitId! }];
      if (config.globalRateLimitId) limits.push({ id: config.globalRateLimitId, key: "assistant-site-wide" });
      for (const l of limits) {
        try {
          const r = await deps.checkRateLimit(l.id, {
            request,
            rateLimitKey: l.key,
            timeout: LIMITS.rateLimitCheckTimeoutMs,
          });
          if (r.error) {
            // A missing rule ("not-found") or a firewall block: never proceed
            // without a working limiter.
            done(503, "assistant.rate_limit_error", { kind: r.error === "blocked" ? "blocked" : "config" });
            return json(503, "unavailable");
          }
          if (r.rateLimited) {
            done(429, "assistant.rate_limited", { scope: l.key ? "site" : "visitor" });
            return json(429, "rate_limited", { "Retry-After": "60" });
          }
        } catch {
          done(503, "assistant.rate_limit_unreachable");
          return json(503, "unavailable");
        }
      }
    }

    const raw = await readCappedBody(request, LIMITS.maxBodyBytes);
    if (raw === null) {
      done(413, "assistant.too_large");
      return json(413, "too_large");
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      done(400, "assistant.bad_json");
      return json(400, "invalid_body");
    }
    const v = validateConversation(body);
    if (!v.ok) {
      done(400, "assistant.invalid", { code: v.code });
      return json(400, v.code);
    }

    const controller = new AbortController();
    const onClientAbort = () => controller.abort();
    request.signal?.addEventListener("abort", onClientAbort, { once: true });
    const hardStop = setTimeout(() => controller.abort(), LIMITS.timeoutMs + 1000);

    const iterator = deps
      .generate({
        model: config.model.id,
        instructions: buildSystemPrompt(),
        messages: v.messages,
        maxOutputTokens: LIMITS.maxOutputTokens,
        timeoutMs: LIMITS.timeoutMs,
        firstTokenTimeoutMs: LIMITS.firstTokenTimeoutMs,
        abortSignal: controller.signal,
        zeroDataRetention: config.zeroDataRetention,
      })
      [Symbol.asyncIterator]();

    const cleanup = () => {
      clearTimeout(hardStop);
      request.signal?.removeEventListener("abort", onClientAbort);
    };

    // Wait for the first words before answering 200, so a failure that
    // happens up front (budget exhausted, timeout, provider down) becomes a
    // proper status code instead of an empty answer.
    let first: IteratorResult<string>;
    try {
      first = await iterator.next();
    } catch (err) {
      cleanup();
      const m = classifyModelError(err);
      done(m.status, "assistant.model_failed_early", { kind: m.error });
      return json(m.status, m.error);
    }
    if (first.done || !first.value) {
      cleanup();
      done(502, "assistant.empty");
      return json(502, "model_error");
    }

    const encoder = new TextEncoder();
    let chars = first.value.length;
    const stream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(first.value));
      },
      async pull(ctrl) {
        try {
          const next = await iterator.next();
          if (next.done) {
            cleanup();
            done(200, "assistant.ok", { chars });
            ctrl.close();
            return;
          }
          chars += next.value.length;
          ctrl.enqueue(encoder.encode(next.value));
        } catch (err) {
          cleanup();
          done(200, "assistant.interrupted", { kind: classifyModelError(err).error });
          ctrl.enqueue(encoder.encode(STREAM_ERROR_MARKER));
          ctrl.close();
        }
      },
      cancel() {
        cleanup();
        controller.abort();
        done(499, "assistant.client_cancelled");
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS },
    });
  };
}
