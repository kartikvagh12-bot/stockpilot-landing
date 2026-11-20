// A single, explicit retry for the specific 503 provider-overload error.
// This is deliberately not a general HTTP/SDK retry policy: no retries for
// authentication, budgets, throttling, timeouts or failed partial answers.
//
// The caller's single deadline covers both attempts and the small backoff.
// Each attempt uses AI SDK maxRetries: 0, and neither model nor retention
// policy changes. No visitor text or provider error payload is logged here.

const OVERLOAD_BACKOFF_MS = 250;
const MIN_RETRY_TIME_MS = 1000;

export function isProviderOverload(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { statusCode?: unknown; code?: unknown; data?: { code?: unknown } };
  return e.statusCode === 503 &&
    (e.code === "server_is_overloaded" || e.data?.code === "server_is_overloaded");
}

function abortError(): Error {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

function timeoutError(): Error {
  const error = new Error("Model response deadline exceeded");
  error.name = "TimeoutError";
  return error;
}

/** Wait briefly, but respect a visitor leaving or cancelling. */
function backoff(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, OVERLOAD_BACKOFF_MS);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Start at most two model attempts total. Retry only if the first attempt
 * failed with the specific 503 overload error BEFORE emitting any text.
 * A partial answer is never repeated, avoiding mixed or duplicated streams.
 */
export async function* retryOnceOnProviderOverload(
  attempt: (remainingMs: number) => AsyncIterable<string>,
  options: { abortSignal: AbortSignal; timeoutMs: number },
): AsyncIterable<string> {
  const deadline = Date.now() + options.timeoutMs;
  for (let index = 0; index < 2; index++) {
    if (options.abortSignal.aborted) throw abortError();
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw timeoutError();

    let emitted = false;
    try {
      for await (const chunk of attempt(remainingMs)) {
        if (chunk) {
          emitted = true;
          yield chunk;
        }
      }
      return;
    } catch (error) {
      if (index !== 0 || emitted || options.abortSignal.aborted ||
          !isProviderOverload(error) ||
          deadline - Date.now() <= OVERLOAD_BACKOFF_MS + MIN_RETRY_TIME_MS) {
        throw error;
      }
      await backoff(options.abortSignal);
    }
  }
}
