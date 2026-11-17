import { z } from "zod";
import { LIMITS } from "@/lib/assistant/runtime/limits";

// Strict validation of the conversation a visitor sends.
//
// The request carries only the conversation: alternating visitor and assistant
// turns, starting and ending with the visitor. Nothing else is accepted: no
// "system" role, no extra fields, no tool calls, no model or parameter
// choices. Assistant turns sent back as history are untrusted too (a client
// can forge them); the system instructions, not the history, are the
// authority, and the length caps below keep forged history small.

export type ChatMessage = { role: "user" | "assistant"; content: string };

const Message = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })
  .strict();

const Body = z
  .object({
    messages: z.array(Message).min(1).max(LIMITS.maxMessages),
  })
  .strict();

/** Normalise line breaks and remove control and invisible formatting
 *  characters that can hide instructions from a human reader. */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[​-‏‪-‮⁠-⁤﻿]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type ValidationResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; code: "invalid_body" | "invalid_turns" | "message_too_long" | "conversation_too_long" | "empty_message" };

export function validateConversation(body: unknown): ValidationResult {
  const parsed = Body.safeParse(body);
  if (!parsed.success) return { ok: false, code: "invalid_body" };

  const messages = parsed.data.messages.map((m) => ({ role: m.role, content: cleanText(m.content) }));

  // Visitor first, strictly alternating, visitor last.
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role !== (i % 2 === 0 ? "user" : "assistant")) return { ok: false, code: "invalid_turns" };
  }
  if (messages[messages.length - 1].role !== "user") return { ok: false, code: "invalid_turns" };

  let total = 0;
  for (const m of messages) {
    if (m.content.length === 0) return { ok: false, code: "empty_message" };
    const cap = m.role === "user" ? LIMITS.maxMessageChars : LIMITS.maxAssistantChars;
    if (m.content.length > cap) return { ok: false, code: "message_too_long" };
    total += m.content.length;
  }
  if (total > LIMITS.maxTotalChars) return { ok: false, code: "conversation_too_long" };

  return { ok: true, messages };
}
