// The assistant's conversation state, as a pure state machine.
//
// Shared by components/AskOperza.tsx and the offline tests, so the tests
// exercise the same transitions the browser runs.
//
// The rule that keeps history valid: the conversation is a list of
// EXCHANGES (one question, one answer). Only exchanges whose answer finished
// normally ("done") are ever sent back to the server as history. A question
// that failed, was stopped, or was interrupted mid-answer stays visible to the
// visitor with its status, but is never sent again as context, so history is
// always strictly visitor/assistant alternating and never contains a partial
// or failed answer.

export type ExchangeStatus =
  | "waiting" // sent, no words yet
  | "streaming" // words arriving
  | "done" // answer finished normally
  | "stopped" // the visitor stopped it
  | "failed"; // the server refused, the network failed, or the stream broke

export type Problem = "rate_limited" | "unavailable" | "too_long" | "failed";

export type Exchange = {
  question: string;
  answer: string;
  status: ExchangeStatus;
  problem?: Problem;
};

export type ConversationState = { exchanges: Exchange[] };

export type ConversationEvent =
  | { type: "ask"; question: string }
  | { type: "chunk"; text: string }
  | { type: "finished" }
  | { type: "failed"; problem: Problem }
  | { type: "stopped" }
  | { type: "retry" }
  | { type: "reset" };

export const MAX_QUESTION_CHARS = 600;
/** Mirrors the server: at most 12 messages, assistant turns at most 2,500
 *  characters, 8,000 characters in total. */
const MAX_MESSAGES = 12;
const MAX_ASSISTANT_CHARS = 2500;
const MAX_TOTAL_CHARS = 8000;

export const initialConversation: ConversationState = { exchanges: [] };

const last = (s: ConversationState) => s.exchanges[s.exchanges.length - 1];
export const isBusy = (s: ConversationState) => {
  const l = last(s);
  return !!l && (l.status === "waiting" || l.status === "streaming");
};

/** The last exchange can be retried if it failed for a reason a retry can fix,
 *  or if the visitor stopped it. */
export const canRetry = (s: ConversationState) => {
  const l = last(s);
  return !!l && ((l.status === "failed" && l.problem !== "too_long") || l.status === "stopped");
};

function replaceLast(s: ConversationState, patch: Partial<Exchange>): ConversationState {
  const l = last(s);
  if (!l) return s;
  return { exchanges: [...s.exchanges.slice(0, -1), { ...l, ...patch }] };
}

export function reduce(s: ConversationState, e: ConversationEvent): ConversationState {
  switch (e.type) {
    case "ask": {
      const q = e.question.trim().slice(0, MAX_QUESTION_CHARS);
      if (!q || isBusy(s)) return s;
      return { exchanges: [...s.exchanges, { question: q, answer: "", status: "waiting" }] };
    }
    case "chunk": {
      const l = last(s);
      if (!l || !isBusy(s) || !e.text) return s;
      return replaceLast(s, { answer: l.answer + e.text, status: "streaming" });
    }
    case "finished": {
      const l = last(s);
      if (!l || !isBusy(s)) return s;
      // A stream that ends without a single word is a failure, not an answer.
      return l.answer.trim()
        ? replaceLast(s, { status: "done", problem: undefined })
        : replaceLast(s, { status: "failed", problem: "failed" });
    }
    case "failed": {
      if (!isBusy(s)) return s;
      return replaceLast(s, { status: "failed", problem: e.problem });
    }
    case "stopped": {
      if (!isBusy(s)) return s;
      return replaceLast(s, { status: "stopped", problem: undefined });
    }
    case "retry": {
      if (!canRetry(s)) return s;
      return replaceLast(s, { answer: "", status: "waiting", problem: undefined });
    }
    case "reset":
      return initialConversation;
  }
}

/**
 * The messages to send for the exchange that is currently waiting: completed
 * exchanges only (newest kept, within the server's limits), then the pending
 * question. Returns null if nothing is waiting.
 */
export function requestMessages(s: ConversationState): { role: "user" | "assistant"; content: string }[] | null {
  const pending = last(s);
  if (!pending || pending.status !== "waiting") return null;

  const done = s.exchanges
    .slice(0, -1)
    .filter((x) => x.status === "done" && x.answer.trim() && x.answer.length <= MAX_ASSISTANT_CHARS);

  // Keep the newest complete exchanges that fit, oldest dropped first.
  const kept: Exchange[] = [];
  let chars = pending.question.length;
  for (let i = done.length - 1; i >= 0; i--) {
    const x = done[i];
    const size = x.question.length + x.answer.length;
    if ((kept.length + 1) * 2 + 1 > MAX_MESSAGES || chars + size > MAX_TOTAL_CHARS) break;
    kept.unshift(x);
    chars += size;
  }

  return [
    ...kept.flatMap((x) => [
      { role: "user" as const, content: x.question },
      { role: "assistant" as const, content: x.answer },
    ]),
    { role: "user" as const, content: pending.question },
  ];
}
