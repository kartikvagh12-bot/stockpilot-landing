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
//
// Every request has its own identity. Asking and retrying give the exchange a
// new requestId from a counter that is never reset (not even by "reset"), and
// every network event carries the requestId it belongs to. An event whose id
// is not the newest exchange's current request is ignored, so a request that
// was abandoned (by "New conversation", or replaced by a retry) can never
// change a newer conversation, however late its events arrive.

export type ExchangeStatus =
  | "waiting" // sent, no words yet
  | "streaming" // words arriving
  | "done" // answer finished normally
  | "stopped" // the visitor stopped it
  | "failed"; // the server refused, the network failed, or the stream broke

export type Problem = "rate_limited" | "unavailable" | "too_long" | "failed";

export type Exchange = {
  /** Identity of the request currently answering this exchange. */
  requestId: number;
  question: string;
  answer: string;
  status: ExchangeStatus;
  problem?: Problem;
};

/** `lastRequestId` only ever grows, so ids are never reused. */
export type ConversationState = { exchanges: Exchange[]; lastRequestId: number };

/** Events reported by a request, each tagged with the request's identity. */
export type RequestEvent =
  | { type: "chunk"; text: string }
  | { type: "finished" }
  | { type: "failed"; problem: Problem }
  | { type: "stopped" };

export type ConversationEvent =
  | { type: "ask"; question: string }
  | (RequestEvent & { requestId: number })
  | { type: "retry" }
  | { type: "reset" };

export const MAX_QUESTION_CHARS = 600;
/** Mirrors the server: at most 12 messages, assistant turns at most 2,500
 *  characters, 8,000 characters in total. */
const MAX_MESSAGES = 12;
const MAX_ASSISTANT_CHARS = 2500;
const MAX_TOTAL_CHARS = 8000;

export const initialConversation: ConversationState = { exchanges: [], lastRequestId: 0 };

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
  return { ...s, exchanges: [...s.exchanges.slice(0, -1), { ...l, ...patch }] };
}

/** The request the conversation is waiting on, if any. */
export function pendingRequest(s: ConversationState): { requestId: number; messages: Message[] } | null {
  const messages = requestMessages(s);
  return messages ? { requestId: last(s).requestId, messages } : null;
}

/** True only for events from the newest exchange's current request. */
const isCurrent = (s: ConversationState, requestId: number) => {
  const l = last(s);
  return !!l && l.requestId === requestId && isBusy(s);
};

export function reduce(s: ConversationState, e: ConversationEvent): ConversationState {
  switch (e.type) {
    case "ask": {
      const q = e.question.trim().slice(0, MAX_QUESTION_CHARS);
      if (!q || isBusy(s)) return s;
      const requestId = s.lastRequestId + 1;
      return { lastRequestId: requestId, exchanges: [...s.exchanges, { requestId, question: q, answer: "", status: "waiting" }] };
    }
    case "chunk": {
      const l = last(s);
      if (!isCurrent(s, e.requestId) || !e.text) return s;
      return replaceLast(s, { answer: l.answer + e.text, status: "streaming" });
    }
    case "finished": {
      const l = last(s);
      if (!isCurrent(s, e.requestId)) return s;
      // A stream that ends without a single word is a failure, not an answer.
      return l.answer.trim()
        ? replaceLast(s, { status: "done", problem: undefined })
        : replaceLast(s, { status: "failed", problem: "failed" });
    }
    case "failed": {
      if (!isCurrent(s, e.requestId)) return s;
      return replaceLast(s, { status: "failed", problem: e.problem });
    }
    case "stopped": {
      if (!isCurrent(s, e.requestId)) return s;
      return replaceLast(s, { status: "stopped", problem: undefined });
    }
    case "retry": {
      if (!canRetry(s)) return s;
      const requestId = s.lastRequestId + 1;
      return { ...replaceLast(s, { requestId, answer: "", status: "waiting", problem: undefined }), lastRequestId: requestId };
    }
    case "reset":
      // The counter survives a reset, so the new conversation's requests can
      // never share an id with one still winding down from the old.
      return { exchanges: [], lastRequestId: s.lastRequestId };
  }
}

/**
 * The messages to send for the exchange that is currently waiting: completed
 * exchanges only (newest kept, within the server's limits), then the pending
 * question. Returns null if nothing is waiting.
 */
export type Message = { role: "user" | "assistant"; content: string };

export function requestMessages(s: ConversationState): Message[] | null {
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
