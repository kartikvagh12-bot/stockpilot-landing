import {
  pendingRequest,
  type ConversationEvent,
  type ConversationState,
} from "@/lib/assistant/client/conversation";
import { streamAnswer } from "@/lib/assistant/client/stream";

// Starts and cancels the network requests for a conversation.
//
// components/AskOperza.tsx calls `sync(state)` after every state change. When
// the newest exchange is waiting, its request is started exactly once, keyed
// by its requestId. There is no shared "in flight" flag: an older request
// that is still winding down (its abort, its final events, its cleanup) can
// never delay or block a newer one, and every event it reports is tagged with
// its own requestId, which the reducer ignores once that request is no longer
// current. The same code runs in the offline tests with a fake fetch.

export type RequestRunner = {
  /** Start the request for a waiting exchange, if it has not been started. */
  sync(state: ConversationState): void;
  /** Cancel the current request (Stop, New conversation, unmount). */
  abort(): void;
};

export function createRequestRunner(options: {
  fetchImpl: typeof fetch;
  dispatch: (event: ConversationEvent) => void;
}): RequestRunner {
  const { fetchImpl, dispatch } = options;
  let current: { requestId: number; controller: AbortController } | null = null;
  let lastStarted = 0;

  return {
    sync(state) {
      const pending = pendingRequest(state);
      if (!pending || pending.requestId <= lastStarted) return;
      // A newer request replaces whatever is still running.
      current?.controller.abort();
      const { requestId, messages } = pending;
      const controller = new AbortController();
      const mine = { requestId, controller };
      current = mine;
      lastStarted = requestId;
      void streamAnswer(messages, {
        fetchImpl,
        signal: controller.signal,
        emit: (event) => dispatch({ ...event, requestId }),
      }).finally(() => {
        if (current === mine) current = null;
      });
    },
    abort() {
      current?.controller.abort();
    },
  };
}
