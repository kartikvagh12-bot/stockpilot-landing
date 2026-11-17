import { checkRateLimit } from "@vercel/firewall";
import { checkBotId } from "botid/server";
import { readAssistantConfig } from "@/lib/assistant/runtime/config";
import { generateWithGateway } from "@/lib/assistant/runtime/generate";
import { createAssistantHandler } from "@/lib/assistant/runtime/handler";

// POST /api/assistant: the public "Ask anything about Operza..." endpoint.
//
// All behaviour lives in lib/assistant/runtime/handler.ts and is tested
// offline (npm run test:assistant-endpoint). This file only wires the real
// dependencies: configuration from the environment, Vercel BotID, Vercel WAF
// rate limiting, and the model through AI Gateway. It fails closed: without
// complete configuration every request gets 503 and no model is called.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const handler = createAssistantHandler({
  readConfig: () => readAssistantConfig(process.env),
  checkBot: () => checkBotId(),
  checkRateLimit: (id, options) => checkRateLimit(id, options),
  generate: generateWithGateway,
  // Structured, content-free logging: an event name and numbers only.
  log: (event, fields) => console.info(JSON.stringify({ event, ...fields })),
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}

// Any other method is refused by the handler with 405; listed so a GET is not
// answered by Next.js with an HTML 404 page.
export async function GET(request: Request): Promise<Response> {
  return handler(request);
}
