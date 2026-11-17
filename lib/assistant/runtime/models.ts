// The models the assistant may run on, and what they cost.
//
// Server-side only. The model is chosen by the ASSISTANT_MODEL environment
// variable and must be one of these ids; anything else fails closed. There is
// no automatic fallback to another model, so the assistant can never move to
// a more expensive model without someone changing configuration.
//
// Prices are US dollars per million tokens, as listed on the Vercel AI Gateway
// public model catalog (https://ai-gateway.vercel.sh/v1/models) on the date
// below. They are used for cost estimates in the evaluator and the docs; the
// enforceable spend cap is the AI Gateway project budget, not this table.

export type ModelPrice = {
  id: string;
  label: string;
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion: number;
  contextWindow: number;
  pricesCheckedOn: string;
};

export const MODEL_CATALOG: Readonly<Record<string, ModelPrice>> = {
  "openai/gpt-6-luna": {
    id: "openai/gpt-6-luna",
    label: "GPT-6 Luna",
    inputPerMillion: 0.1,
    outputPerMillion: 0.5,
    cachedInputPerMillion: 0.01,
    contextWindow: 1_050_000,
    pricesCheckedOn: "2026-11-17",
  },
  "openai/gpt-6.1-terra": {
    id: "openai/gpt-6.1-terra",
    label: "GPT-6.1 Terra",
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
    cachedInputPerMillion: 0.05,
    contextWindow: 1_050_000,
    pricesCheckedOn: "2026-11-17",
  },
};

/** Cost in US dollars for a request with the given token usage. */
export function estimateCostUsd(
  model: ModelPrice,
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens?: number },
): number {
  const cached = Math.min(usage.cachedInputTokens ?? 0, usage.inputTokens);
  const fresh = usage.inputTokens - cached;
  return (
    (fresh * model.inputPerMillion +
      cached * model.cachedInputPerMillion +
      usage.outputTokens * model.outputPerMillion) /
    1_000_000
  );
}
