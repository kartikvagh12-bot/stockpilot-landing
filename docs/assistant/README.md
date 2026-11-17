# Operza website assistant: knowledge and evaluation foundation

The assistant on operza.in ("Ask anything about Operza...") answers visitors'
questions about Operza, Operza Shift and Operza Linspace. This file covers
its knowledge and evaluation (PR #25). The runtime, the homepage input, the
security controls, costs and setup are in `RUNTIME.md` (PR #26); the
assistant ships switched off until the Founder configures it.

## Layout

| File | What it is |
|---|---|
| `lib/assistant/types.ts` | Types for knowledge entries, sources and evaluation cases. |
| `lib/assistant/sources.ts` | The one pinned `operza-app` commit every product statement was checked against. |
| `lib/assistant/knowledge.ts` | The knowledge base: one entry per statement, each labelled and cited. |
| `lib/assistant/destinations.ts` | The only pages and contact details the assistant may link to, read from `lib/site.ts`. |
| `lib/assistant/instructions.ts` | The behaviour rules, and `systemInstructions()`, the exact text a model would receive. |
| `lib/assistant/evals/cases.ts` | The evaluation dataset. |
| `lib/assistant/evals/grade.ts` | The deterministic grader shared by the offline tests and the future live evaluation. |
| `scripts/test-assistant-knowledge.mjs` | Offline guard: `npm run test:assistant`. |
| `scripts/verify-assistant-sources.mjs` | Citation check against `operza-app`: `npm run verify:assistant-sources`. |
| `docs/assistant/MODEL_PLAN.md` | Candidate models and the runtime plan. Not a decision. |
| `docs/assistant/RUNTIME.md` | How the live assistant works, every control, Founder setup, costs, privacy. |
| `lib/assistant/runtime/` | Configuration, request handler, model call, limits, validation and served prompt. |
| `app/api/assistant/route.ts` | The public endpoint, wiring the real BotID, WAF rate limit and AI Gateway. |
| `components/AskOperza.tsx` | The homepage input, rendered only when the assistant is configured. |
| `scripts/test-assistant-endpoint.mjs` | Offline security tests: `npm run test:assistant-endpoint`. |
| `lib/assistant/client/` | Browser conversation state machine and streaming client. |
| `scripts/test-assistant-conversation.mjs` | Conversation recovery tests: `npm run test:assistant-conversation`. |
| `lib/assistant/evals/judge.ts`, `report.ts` | Semantic grading (human or model judge) and the report that keeps it apart from pattern checks. |
| `scripts/assistant-eval-live.mjs` | Live evaluation with a hard budget: `npm run eval:assistant`. |

## How the knowledge base avoids becoming a second authority

Every entry has a **kind**:

- **product-fact** and **limitation**: what Operza Shift does and does not
  do, checked against `operza-app` source code (or its
  `docs/PROJECT_STATE.md`) at the pinned commit in `sources.ts`. Each cites
  the file and an exact **anchor**: text copied verbatim from it.
- **marketing-copy**: Founder-approved website wording, cited to the page in
  this repository that renders it. Positioning, never evidence of a feature.
- **policy**: how the assistant behaves (pricing, Linspace, contact),
  cited to the recorded decision.
- **unknown**: questions deliberately left unanswered. The assistant says it
  does not know and offers a person.

A citation is only as good as its anchor, so anchors are checked by script:
`test:assistant` checks every citation into this repository on every run,
and `verify:assistant-sources` reads every `operza-app` citation at the pinned
commit with `git show`. If an anchor is not in the file, the citation fails.

## Updating it when the product changes

1. Read `operza-app` at its new `main`, starting with `docs/PROJECT_STATE.md`.
2. Change or add statements, each with a fresh anchor from the new commit.
3. Move `PRODUCT_SOURCE.commit` (and the commit recorded in `CLAUDE.md`).
4. Run `OPERZA_APP_DIR=<checkout> npm run verify:assistant-sources` and
   `npm run test:assistant`. Both must pass.
5. Add or adjust evaluation cases for anything visitors will now ask about.

Never edit a statement without re-reading its source, and never add a
capability because the website or a sales conversation says so.

## Languages

The Founder asked that the assistant adapt to English, Hindi and Gujarati
where the model can do so accurately. The knowledge base is written once, in
English; the assistant answers in the visitor's language and keeps product
and plan names in English. The evaluation set includes Hindi and Gujarati
conversations, graded for script and for the same forbidden claims as English.
The application itself is in English; the assistant must not imply otherwise.

## Deterministic tests versus live evaluation

| | Deterministic (now) | Live (runtime PR) |
|---|---|---|
| Cost | Free, offline | Paid model calls, Founder-approved budget |
| What it proves | The dataset is well formed; every reference answer passes its own case; every forbidden claim, planted into it, fails; links resolve; citations hold | How a candidate model actually answers each case |
| Grader | `grade()` | `grade()` first, then a judge for `facts` and `distinctions` |

The deterministic grader is a floor. Regular expressions can prove that a
forbidden claim was made; they cannot prove an answer was helpful, so the
live run adds a judge for that.
