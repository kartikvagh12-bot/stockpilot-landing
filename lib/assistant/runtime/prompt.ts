import { systemInstructions } from "@/lib/assistant/instructions";

// The exact instructions the live assistant runs under: the reviewed rules,
// destinations and knowledge from PR #25 (systemInstructions), plus how to
// format text for the website's renderer. Both the endpoint and the live
// evaluator use this function, so what is evaluated is what is served.

const FORMAT = [
  "FORMAT",
  "- Write plain text only: no Markdown headings, bold, tables or code blocks.",
  "- Use short paragraphs separated by a blank line. For a list, start each line with \"- \".",
  "- Write links as bare site paths from DESTINATIONS (for example /shift#contact), never as Markdown links and never as full URLs, except https://app.operza.in for signing in.",
  "- Keep most answers under 120 words.",
].join("\n");

export function buildSystemPrompt(): string {
  return `${systemInstructions()}\n\n${FORMAT}`;
}
