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
| `lib/assistant/destinations.ts` | The only pages and contact details the assistant may link to, read from `lib/site.ts`, most specific first (the `/shift` sections, then whole pages). The browser links exactly this list. |
| `lib/assistant/instructions.ts` | The behaviour rules, the topic checklists (`TOPIC_CHECKLISTS`), and `systemInstructions()`, the exact text a model would receive. |
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

## Response quality: links and topic checklists

The first live evaluation (2026-11-19, 67 cases, GPT-6 Luna and GPT-6.1
Terra, saved locally under `eval-results/`) gave answers that were mostly
correct but missed links and left out key limits. Of the 26 missed links:

* 10 expected `/shift#factory`, `#books`, `#costing` or `#complete`, which
  were never in `DESTINATIONS`, so the model had never been offered them;
* 10 had no link at all, because the rule said "when a link helps";
* 6 chose a less specific link, mostly `/#contact` for Linspace questions,
  because the Linspace rule offered "/linspace or /#contact".

The four sections are now destinations. The `links` rule asks for the most
specific link at the end of every Operza answer and says which link fits
which kind of question. The Linspace rule links `/linspace` first.

`TOPIC_CHECKLISTS` lists the points an answer on Factory versus Complete,
Tally, GST or Linspace should not leave out (for example, that the TallyPrime
export is part of Complete, or every GST limit, not just one). Each point
restates the knowledge entries it cites and adds nothing; section K of
`test:assistant` checks the citations, the links, and that every specific
term in a checklist comes from the knowledge it cites. Whether the models
follow these is measured only by the next live evaluation.

## Denials versus claims in the deterministic grader

A forbidden-claim pattern matches words, so a correct denial can trip it:
"it isn't a live sync" contains "live sync", and "I can't confirm a discount"
contains "discount". In the saved GPT-6 Luna run of 2026-11-19, 12 of the 16
flagged answers were flagged only for this.

The grader has no general negation rule. A pattern may list exact denial
forms (`denials` on a `Pattern`, the `DENY` table in `evals/cases.ts`). Before
that pattern runs, the grader replaces only the words a listed denial matches,
so anything said before or after is still checked: "No automatic Tally sync,
but Operza now synchronizes directly with TallyPrime" fails on its second
half. Denials never cross a sentence, a semicolon, a comma clause or "but".
For pricing and certifications only doubt is recognised ("can't confirm",
"isn't confirmed"), never a flat "there is no free trial", which would itself
be an unapproved claim.

Every denial carries an example the pattern alone flags and the affirmative
claim it must not excuse. Section L of `test:assistant` proves each example
passes, each affirmative fails alone and next to the denial, and that
sentences with an unrelated "no" or "not" nearby still fail. The number of
denial forms is pinned, so adding one is a reviewed change.

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
