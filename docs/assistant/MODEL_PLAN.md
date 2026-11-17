# Assistant model plan (candidates, not a decision)

Status: **planning only.** No AI dependency is installed, no credential is
configured, no endpoint exists and no model has been called. Nothing in this
document is approved for production; the provider, model, budget and
conversation-retention policy remain open Founder decisions (`CLAUDE.md`).

## Candidates named by the Founder

Both exist on Vercel AI Gateway's public model list. Prices below are what
that list showed on **2026-11-17** for the standard tier, in US dollars per
million tokens. They are recorded to size the decision, not as a quote:
**re-check them on the day the runtime PR is written.**

| Candidate | Gateway model id | Released (per Gateway) | Context | Input | Output | Cached input |
|---|---|---|---|---|---|---|
| GPT-6 Luna | `openai/gpt-6-luna` | 2026-09-22 | 1,050,000 | $0.10 | $0.50 | $0.01 |
| GPT-6.1 Terra | `openai/gpt-6.1-terra` | 2026-10-26 | 1,050,000 | $1.00 | $5.00 | $0.05 |

The list also offers `-fast` (about twice the price) and `-batch` (about half)
variants of each. Batch is irrelevant for a live chat; it may suit the
offline live-model evaluation run.

Rough sizing, to be replaced by measurement: the system instructions
(`systemInstructions()` in `lib/assistant/instructions.ts`) are a few
thousand tokens and identical on every turn, so prompt caching applies; a
typical answer is under 300 tokens. At those sizes Luna is roughly a tenth of
Terra's cost per conversation. Whether Luna is accurate enough on the
evaluation set (especially plan boundaries, the GST and Tally limitations,
prompt injection, Hindi and Gujarati) is exactly what the live evaluation
must decide. Neither should be chosen on price alone.

## Expected runtime (to verify, not assumed)

- **Vercel AI SDK and AI Gateway**, with plain `"provider/model"` strings
  through the Gateway so the model can be swapped without code changes.
- **Compatibility is unverified.** This site runs Next.js 14.2 and React 18.
  The current AI SDK major requires Node 22+ and ESM; before installing, the
  runtime PR must confirm the SDK's server API works in a Next 14 App Router
  route handler on the Node runtime, and whether its React hooks support
  React 18 or whether the small client should be written without them.
- **Credentials**: Gateway access through Vercel's OIDC on the deployment,
  configured by the Founder. No key is created or stored by this work.
- **Controls the runtime PR must include**: a spend cap, per-visitor rate
  limiting and bot protection, an input length cap, no tools and no data
  access for the model, streaming output, and no conversation logging unless
  and until the Founder approves a retention policy.

## Evaluation before choosing

1. Deterministic floor (exists now): `npm run test:assistant` proves the
   evaluation cases are well formed, satisfiable and able to catch the
   claims they forbid.
2. Live evaluation (runtime PR): run every case in `lib/assistant/evals/cases.ts`
   against each candidate with `systemInstructions()`, grade each answer
   with `grade()` first, then have a judge score `expect.facts` and
   `expect.distinctions`. Report per-category pass rates and cost per
   conversation, and require 100% on the safety categories
   (`prompt-injection`, `data-access`, `pricing`, `linspace`) before a
   candidate can go live.
