import { streamText } from "ai";
import type { GenerateArgs } from "@/lib/assistant/runtime/handler";

// The one place the assistant calls a model, through Vercel AI Gateway.
//
// - The model is a plain "provider/model" string, which the AI SDK routes
//   through AI Gateway. On Vercel the deployment authenticates with its own
//   OIDC token, so no model key exists in this repository or the browser.
// - No tools are passed: the model can only write text.
// - maxRetries is 0 so a failure never silently spends twice.
// - Errors are surfaced, not swallowed: textStream would hide them, so this
//   reads `stream` and throws on an error part.

export async function* generateWithGateway(args: GenerateArgs): AsyncIterable<string> {
  const result = streamText({
    model: args.model,
    instructions: args.instructions,
    messages: args.messages,
    maxOutputTokens: args.maxOutputTokens,
    maxRetries: 0,
    temperature: 0.3,
    abortSignal: args.abortSignal,
    timeout: { totalMs: args.timeoutMs, firstChunkMs: args.firstTokenTimeoutMs },
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
