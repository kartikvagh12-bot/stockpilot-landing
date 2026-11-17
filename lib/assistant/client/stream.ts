import type { ConversationEvent, Problem } from "@/lib/assistant/client/conversation";

// Sends one question to /api/assistant and turns everything that can happen
// into conversation events: a refusal before streaming, words arriving, a
// clean finish, a stream that breaks after some words, a network failure, or
// the visitor stopping it. `fetchImpl` is injected so the offline tests drive
// exactly this code with fake responses.

/** Appended by the server when a stream breaks after it started. */
export const STREAM_ERROR_MARKER = "\u001Eerror";

export function problemForStatus(status: number): Problem {
  if (status === 429) return "rate_limited";
  if (status === 400 || status === 413) return "too_long";
  if (status === 503) return "unavailable";
  return "failed";
}

export async function streamAnswer(
  messages: { role: "user" | "assistant"; content: string }[],
  options: {
    fetchImpl: typeof fetch;
    signal: AbortSignal;
    emit: (event: ConversationEvent) => void;
  },
): Promise<void> {
  const { fetchImpl, signal, emit } = options;
  const aborted = () => signal.aborted;
  // Text read but not yet shown: the tail is held back so a marker split
  // across two chunks is never displayed. Flushed on every way out.
  let held = "";
  try {
    const res = await fetchImpl("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
    if (!res.ok || !res.body) {
      emit({ type: "failed", problem: problemForStatus(res.status) });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      held += decoder.decode(value, { stream: true });
      const at = held.indexOf(STREAM_ERROR_MARKER);
      if (at >= 0) {
        if (at > 0) emit({ type: "chunk", text: held.slice(0, at) });
        await reader.cancel().catch(() => {});
        emit({ type: "failed", problem: "failed" });
        return;
      }
      const safe = held.length - (STREAM_ERROR_MARKER.length - 1);
      if (safe > 0) {
        emit({ type: "chunk", text: held.slice(0, safe) });
        held = held.slice(safe);
      }
    }
    held += decoder.decode();
    if (held) emit({ type: "chunk", text: held });
    emit({ type: "finished" });
  } catch (err) {
    // Show what had already arrived before reporting how it ended, minus any
    // fragment of the break marker that arrived just before the failure.
    held = held.replace(/\u001E[a-z]*$/, "");
    if (held) emit({ type: "chunk", text: held });
    if (aborted() || (err as Error)?.name === "AbortError") emit({ type: "stopped" });
    else emit({ type: "failed", problem: "failed" });
  }
}
