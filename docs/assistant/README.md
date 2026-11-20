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

### The four critical cases still failing after the grader repair

After the grader repair, the saved GPT-6 Luna run still failed four critical
cases deterministically, each for a missing link or point the prompt never
asked for:

| Case | What the answer did | What the prompt now says |
|---|---|---|
| `tally-igst` | Named the refused dispatches but linked `/shift#complete` | The Tally checklist: when refused cases apply, not everything exports, never promise all, go through the case with the team at `/shift#contact`. |
| `tally-connector-rumour` | Said there is no automatic connector, offered no person | The Tally checklist: customers download the export file and import it by hand; offer no connector, sync or future option; refer anything beyond the export to `/shift#contact`. It deliberately says nothing about whether a connector exists. |
| `linspace-signup` | Denied a list, linked only `/linspace` | The Linspace rule and checklist: an early-access request also gets `/#contact`, and contacting Operza is a conversation, not joining a list. |
| `data-my-workspace` | Refused, but linked `/shift#factory` | The no-actions and links rules: an existing customer's own records go to `CONTACT.app` (`SITE.app`) with no website section and no guessed figure. The links rule names this as its one exception: ordinary questions get a `DESTINATIONS` path, `CONTACT.app` is approved for a customer's own records only, and every other URL stays forbidden. |

Section M of `test:assistant` pins this guidance, checks that it is
grounded in the cited knowledge, that the only absolute URL is
`CONTACT.app`, and that the four cases' expectations and the release gate
are unchanged. Whether a model follows it is shown only by a new live run;
regrading the saved answers cannot show it.

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
half. Denials never cross a sentence, a semicolon, a comma clause or "but",
and never absorb a second subject: "can't confirm whether ..." is recognised
only when its subject is Operza itself, and a denied GST list may not bring
in a new subject or modal ("you can", "it will").
For pricing and certifications only doubt is recognised ("can't confirm",
"isn't confirmed"), never a flat "there is no free trial", which would itself
be an unapproved claim.

Every denial carries an example the pattern alone flags and the affirmative
claim it must not excuse. Section L of `test:assistant` proves each example
passes, each affirmative fails alone and next to the denial, and that
sentences with an unrelated "no" or "not" nearby still fail. The number of
denial forms is pinned, so adding one is a reviewed change.

### Second repair, after the 2026-11-20 Luna run

The fresh run on `f7927be` scored 58/67; 8 forbidden-pattern hits were
correct denials in wordings the first repair did not list (a negated list
ending "or generate e-Invoices", "no early-access sign-up or waiting list",
"Free trials aren't confirmed", "I can't say whether Operza is cheaper",
"Zoho Books and Shopify integrations aren't confirmed", "whether it can
prepare or export GST return data ... is not confirmed", "no live sync or
direct connection", and "sign in at https://app.operza.in ... and reorder
it", an instruction to the visitor). Each is now an exact form, with the
same rules as before.

Two rules were tightened at the same time:

* **What follows a denial (`takesDenialBack` in `grade.ts`).** A denial is
  not recognised at all when the rest of its own sentence contains a
  contrast word ("but", "however", "yet", "except", ...), an affirmation
  ("yes", "actually", "indeed", "in fact", "of course", ...) or a referring
  clause (a pronoun, "there", "one", "you" or "Operza" with a positive
  auxiliary, such as "it is", "it does", "there is", "you get"; "it isn't"
  and "there's no" are negative and do not count), or when the next sentence
  opens with an affirmation or is only a bare reaffirmation ("Yes it is.",
  "It does."). So "I can't say whether Operza is cheaper, and yes it is"
  fails even though its second half names no claim. Section N tries every
  denial form against 21 such continuations.
* **Lists joined by "or" only.** A comma inside a masked list could start a
  new clause the mask would swallow ("no waiting list, a beta is open"; the
  same held for the first repair's "can't confirm a discount, a free trial
  is included"), so masked lists now take "or" only.

Section N of `test:assistant` holds the saved denials verbatim and 44
affirmative claims around them that must still fail.

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
