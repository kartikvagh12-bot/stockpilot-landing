import { streamText } from "ai";
import type { GenerateArgs } from "@/lib/assistant/runtime/handler";
import { retryOnceOnProviderOverload } from "@/lib/assistant/runtime/overload-retry";

// The one place the assistant calls a model, through Vercel AI Gateway.
//
// - Same configured model and zero-data-retention setting on both attempts.
// - No tools are passed. AI SDK maxRetries stays 0.
// - Only a 503 server_is_overloaded BEFORE any text permits one explicit
//   retry, within the existing 25-second request deadline.
// - All other errors, and every error after text begins, propagate normally.
// - Read result.stream: textStream hides provider error events.

async function* streamAttempt(args: GenerateArgs, remainingMs: number): AsyncIterable<string> {
  const result = streamText({
    model: args.model,
    instructions: args.instructions,
    messages: args.messages,
    maxOutputTokens: args.maxOutputTokens,
    maxRetries: 0,
    temperature: 0.3,
    abortSignal: args.abortSignal,
    timeout: { totalMs: remainingMs, firstChunkMs: Math.min(args.firstTokenTimeoutMs, remainingMs) },
    providerOptions: {
      gateway: { zeroDataRetention: args.zeroDataRetention },
    },
  });

  for await (const part of result.stream) {
    if (part.type === "text-delta") {
      if (part.text) yield part.text;
    } else if (part.type === "error") {
      throw part.error;
    }
  }
}

export function generateWithGateway(args: GenerateArgs): AsyncIterable<string> {
  return retryOnceOnProviderOverload(
    (remainingMs) => streamAttempt(args, remainingMs),
    { abortSignal: args.abortSignal, timeoutMs: args.timeoutMs },
  );
}
