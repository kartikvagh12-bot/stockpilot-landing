# CURRENT STATE (November 2026): AUTHORITATIVE

**Read this section first. Everything below "Historical log" is out of date
unless it is explicitly marked current.**

The site is now multi-product: `/` is the Operza company homepage, `/shift` is
Operza Shift, `/linspace` is Operza Linspace (in development) and
`/health-check` is unchanged. It was built as one release candidate (GAD v1
PR 2, #24), approved visually by the Founder, and has been live on
www.operza.in since merge `e5e2cf5` (2026-11-17).

## Approved direction (Founder, 2026-11-17)

Approved by the Founder with ChatGPT review, after a read-only architecture
review (Phase 0). The website becomes the official multi-product site for
Operza.

* **Operza is the sole public-facing parent brand.** Do not present "Operza
  Technologies" as a public brand.
* **The registered legal name, Operza Technologies Private Limited, belongs
  only in legal and footer contexts and appropriate structured data.** It is
  read from `SITE.legalName` (`lib/site.ts`).
* **Operza Shift** is the website-level product family name for the existing
  manufacturing and business operations SaaS (`app.operza.in`). It is a
  website name for now: do not rename the live application, and do not rename
  its plans. Operza Factory, Operza Books and Operza Complete keep their names
  and their real functional boundaries.
* **Operza Linspace** is a planned construction product: drawing
  interpretation, quantity takeoff, BOQ generation and cost estimation. It is
  **not launched**. It may be introduced only as in development, with no
  invented functionality, release dates, pricing or availability.
* **Existing work is preserved**: the interactive demos, the product
  explanations, the brand identity, the approved pearl-relief intro design and
  the working lead capture.
* **A conversational assistant** is planned, with the placeholder "Ask anything
  about Operza...". It must be functional, and grounded in verified
  information, when it is introduced. Do not ship a placeholder box that does
  not answer. Avoid prominently branding it "Ask Operza AI".


### Routes

| Route | What it is |
|---|---|
| `/` | Operza company homepage: hero, What we build, Operza Shift, Operza Linspace, Our approach, Contact. |
| `/shift` | Operza Shift: the previous homepage's manufacturing story, moved whole (pearl-relief intro, founder hero, interactive examples, plans, product sections, Health Check callout, FAQ, demo-request form). |
| `/linspace` | Operza Linspace, labelled in development. `noindex`, no form, no structured data. |
| `/health-check` | The Manufacturing Health Check. Scoring frozen; its "Book a demo" links go to `/shift#contact`. |

Old homepage fragment links (`/#factory`, `/#books`, `/#costing`,
`/#complete`, `/#product`, `/#plans`, `/#faq`) are forwarded client-side to the
same section on `/shift` by `components/LegacyAnchorForward.tsx`. `/#contact`
stays on the homepage, whose contact section leads with the demo booking.

### Delivery rules for this programme

* **`/` and `/shift` change together.** Done atomically in the release
  candidate: there is no state of `main` where the same product content is
  served on two URLs.
* **Each implementation PR updates its own docs and marketing tests.** The
  guards in `scripts/` are rewritten in the same PR that changes the surface
  they pin, never deferred to a cleanup PR.
* **Nothing about the assistant is approved beyond the direction above.** No
  AI provider, model, dependency, budget or conversation-retention policy has
  been approved.
* Do not introduce GAD Nexus, Herdr or Codex orchestration into this
  repository. GAD v1 is the collaboration workflow here: Founder decides,
  ChatGPT reviews, Claude Code inspects, implements and tests. Every PR is
  reviewed on its exact GitHub diff before merge.

### Founder decisions made

From the PR #22 review (2026-11-17):

1. **The manufacturing introduction and hero move to `/shift`.** Done. The
   intro keeps its pearl-relief design and its approved wording, with
   "Operza" made "Operza Shift" where it names the product ("What is Operza
   Shift?"). The hero keeps its founder-set headline.
2. **Organization structured data uses `name: "Operza"`** and
   `legalName: SITE.legalName`. Done, on the homepage.
3. **"Open App" keeps its label and its destination (`SITE.app`).** Done.

From the PR 2 brief (2026-11-17, provisional copy, minor edits allowed):

4. **Company homepage**: eyebrow "Software for complex work", headline
   "Complex work. Clearer possibilities.", supporting line "Operza builds
   software for complex business workflows. Our first product serves
   manufacturing, and we're developing our next for construction." Sections:
   hero, What we build ("Different industries. One approach."), Operza Shift,
   Operza Linspace, Our approach ("Software shaped around real work."),
   contact, footer. Pinned by section M of the copy guard.
5. **Operza Linspace for the release candidate**: heading "A clearer way to
   work with construction information.", `noindex`, no early-access sign-up
   or waiting list, generic company contact only. Revisitable after review.
6. **Visual direction**: Architectural and Editorial. Deep charcoal hero,
   large editorial type, pearl-white sections, restrained red, linework drawn
   in CSS and inline SVG, no animation dependency, reduced motion honoured.
7. **Health Check callout** stays on `/shift` only; the homepage links the
   Health Check from the navbar and footer.

From the PR #24 final review (2026-11-17):

8. **Visual approval** of the multi-product site: given; merged and live.

From the PR #25 brief (2026-11-17):

9. **The public assistant is approved for development**, in stages. Stage one
   (PR #25) is the knowledge base and offline evaluation only: no endpoint,
   no UI, no AI dependency, no credentials, no spending. GPT-6 Luna and
   GPT-6.1 Terra are named candidates for later evaluation, not choices.
   The assistant should adapt to English, Hindi and Gujarati.

From the 2026-11-20 launch direction:

10. **Discovery-pilot release of the assistant** (`docs/assistant/PILOT_RELEASE.md`):
    a basic product-discovery assistant, released on the Founder's manual
    acceptance of documented completeness limitations. The evaluation
    results, the deterministic grader and the automated release gate stay
    as they are (the gate still reports NOT eligible). Every safety, privacy
    and spending control stays mandatory, and activation still needs the
    checklist in RUNTIME.md and separate Production authorization.
    Knowledge stays static: update and re-verify it when a customer-facing
    feature ships, in the same website deployment.

### Open Founder decisions

1. Final company-level copy. The homepage copy is the Founder's provisional
   direction; nothing beyond it (history, team, customers, achievements) is
   on the site.
2. Linspace later: indexing, early-interest handling, and any vocabulary that
   would need the site-wide "cost intelligence" ban scoped deliberately.
3. Assistant (PR #26 built it switched off; pilot release approved in
   principle, decision 10, with outstanding items in PILOT_RELEASE.md): the Founder actions in
   `docs/assistant/RUNTIME.md` (AI Gateway access, the project budget, the
   `assistant-visitor` WAF rule, Preview protection bypass, Preview-only
   environment variables), an approved budget for the paid evaluation, the
   model choice after it, whether to enable zero data retention (needs
   purchased AI Gateway credits on Hobby), and production release. The
   knowledge base answers pricing with "discussed during a demo"; changing
   that is a Founder decision.

## Site architecture

* **Product registry**: `PRODUCTS` in `lib/site.ts` names Operza Shift
  (`/shift`, `available`, Manufacturing) and Operza Linspace (`/linspace`,
  `in-development`, Construction), both `pageLive: true`. Marketing identity
  only: no plans, features or capabilities, which stay in `operza-app`. The
  navbar's Products menu, the footer, the homepage index and every status
  label read from it (`STATUS_LABEL`).
* **Navigation**: Products menu (a click disclosure: keyboard, touch, Escape
  and outside-click all close it), Company (`/#company`), Health Check, Open
  App, Book a demo (`DEMO_HREF`). Mobile sheet lists the same.
* **Footer**: Operza as the brand, product, company and contact columns. The
  registered name appears once, in the copyright line, from
  `SITE.legalName`. No legal pages are linked because none exist.
* **Metadata**: the root layout carries company defaults (title template
  `%s | Operza`). `/shift` and `/linspace` set their own title, description,
  canonical URL and social card. Social cards come from `CARDS` in
  `lib/og-card.tsx` (company, Shift, Linspace; the Health Check shares the
  Shift card), in Operza red.
* **Structured data**: Organization and WebSite on `/`; SoftwareApplication
  ("Operza Shift", from the registry) and FAQPage on `/shift`; none on
  `/linspace`.
* **Sitemap**: `/`, `/shift`, `/health-check`. Not `/linspace` (noindex).
* **Artwork** (`components/art/`): `TangleToOrder` (company hero: tangled
  workflows through a frame into ordered lanes, one in red), `ShiftFlow`
  (the plan boundaries as a diagram: only Operza Complete joins floor and
  books, in red), `PlanDrawing` (an architectural plan with one room taken
  off in red). Drawn once on load with `.draw`/`.appear`; reduced motion
  shows them finished.

The approved pearl-relief intro (`components/OperzaIntro.tsx`, restored
exactly from `9c62a8e`) now opens `/shift`. Treat the relief as the approved
design: refine it, do not replace it, without Founder direction. Its copy is
pinned by section L of `scripts/test-marketing-copy.mjs`.

Operza Shift's hero headline (founder-set, 2026-09-10), pinned by K1:

> Run what you make, what you move, what you sell, and the books behind it.

Operza Shift's positioning (no longer the company definition):

> Operza Shift is manufacturing software for Indian factories. It runs the shop
> floor and the business books, and in Operza Complete they are one system.

## Assistant (`lib/assistant/`, `/api/assistant`, `components/AskOperza.tsx`)

The "Ask anything about Operza..." assistant. **Implemented in PR #26 and
switched off**: it fails closed unless an environment is fully configured,
and production needs `ASSISTANT_ALLOW_PRODUCTION=true` on top. While off, the
endpoint answers 503 without a model call and the homepage renders exactly
as before (no input, no BotID script). Setup, controls, costs and privacy:
`docs/assistant/RUNTIME.md`; knowledge and evaluation: `docs/assistant/README.md`.

* `runtime/config.ts` (fail-closed configuration, the only place that reads
  the environment), `runtime/handler.ts` (origin, size, BotID, WAF rate
  limit, validation, model call; dependencies injected for testing),
  `runtime/generate.ts` (the one AI SDK call: AI Gateway, no tools, no
  retries), `runtime/models.ts` (the two approved model ids and prices),
  `runtime/limits.ts`, `runtime/validate.ts`, `runtime/prompt.ts`.
* The spending cap is the AI Gateway **project budget**, set by the Founder;
  never a prompt or browser counter. Logs carry no visitor text, IP or user
  agent. Nothing is stored.
* `lib/assistant/client/` (browser): `conversation.ts`, the conversation
  state machine (only finished answers are ever sent back as history; every
  request has an id and events from a request that is no longer current are
  ignored), `requests.ts`, which starts one request per id with no shared
  in-flight flag, and `stream.ts`, the streaming client. Tested by
  `test:assistant-conversation`, including overlapping requests.
* `ASSISTANT_BUDGET_CONFIRMED` is a manual assertion, not proof. Before any
  activation, the Gateway budget and the published `assistant-visitor` WAF
  rule are verified independently (activation checklist in RUNTIME.md).
  Production also needs `ASSISTANT_ALLOWED_ORIGINS=https://www.operza.in`.
* Evaluation never reports pattern checks as accuracy: deterministic checks,
  semantic accuracy (human review or a paid model judge, `evals/judge.ts`),
  unevaluated cases and measured cost are reported apart (`evals/report.ts`),
  with a release gate on the critical categories measured against the full
  case inventory: every critical case exactly once per model, and the run
  itself complete (not `--cases`-filtered, not budget-stopped, recorded in
  `run.json`), so partial or interrupted runs never pass. No model has been evaluated yet.
* BotID is wired (client, server, `withBotId` in `next.config.mjs` only when
  enabled) and tested offline; real bot detection is unvalidated until a
  configured Preview is checked.
* `npm run test:assistant-endpoint`, `npm run test:assistant-conversation`
  (offline) and `npm run eval:assistant` (dry-run cost estimate; a paid run
  needs `--run`, `--budget-usd` and a Gateway key).

* `knowledge.ts`: every statement is labelled product-fact, limitation,
  marketing-copy, policy or unknown. Product facts and limitations cite
  `operza-app` at `PRODUCT_SOURCE.commit` with a verbatim anchor; copy cites
  the page here that renders it. It is not a second authority: change a
  statement only after re-reading its source, and move the pin (here and in
  `lib/assistant/sources.ts`) when you re-verify.
* `instructions.ts`: the behaviour rules, `TOPIC_CHECKLISTS` (points an
  answer on Factory vs Complete, Tally, GST or Linspace must not leave out,
  each restating cited knowledge) and `systemInstructions()`. Every link a
  case expects must be in `destinations.ts`, which the browser links
  exactly (section K of `test:assistant`).
* `evals/cases.ts` and `evals/grade.ts`: the evaluation set and the
  deterministic grader shared with the future live evaluation.
* `npm run test:assistant` (offline, every run) and
  `OPERZA_APP_DIR=<operza-app checkout> npm run verify:assistant-sources`
  (re-reads every product citation at the pinned commit).

## Product truth (Operza Shift)

Product truth lives in **`kartikvagh12-bot/operza-app`**, not here. This repo
markets the product; it never defines it. `operza-app/docs/PROJECT_STATE.md`
is its current-status truth. Before writing or changing any customer-facing
claim, verify it against that repository's current source.

Last checked (read-only, 2026-11-17, for the multi-product release
candidate) against `operza-app` `main`:

```
b676a075b5dcfa6ad46d19e19df5440277220920
```

The three commits since the previous check (`b0077fc`) are internal cost-engine
documentation and test harnesses; no customer-facing claim changed. Every
Operza Shift claim on the site was found still true.

Three customer-selectable plans, declared in `operza-app/lib/capabilities.ts`
and named on its onboarding screen:

* **Operza Factory**: run the floor: inventory, production and dispatch. No
  accounting or books.
* **Operza Books**: run the books: invoices, bills, payments and statements.
  No stock, production or dispatch.
* **Operza Complete**: the whole business: the factory plus connected
  accounting, including Tally export.

Capability gating enforces these boundaries. Factory dispatch does not post an
accounting invoice, and Books does not receive materials into stock. The
connected behaviour belongs to Complete. Beyond inventory and production there
is a cost and valuation engine, sales margin, double-entry accounting through
to Profit & Loss and Balance Sheet, and a TallyPrime export path.

Facts current at `b676a07` that copy and any future assistant must respect:

* **Tally is export only for customers.** A connector is built in the app but
  no customer has installed it. Do not claim sync, a direct connection or
  "complete Tally integration".
* **No GST e-Invoice or e-Way Bill generation exists.** A GST add-on stores
  statutory details (GSTIN, addresses) only.
* **Supplier-bill reading is AI reading, and not guaranteed everywhere.** In
  Books and Complete an uploaded PDF or photo is read by an AI model, and the
  user checks everything before it is recorded. Say "reads it, you verify";
  never say OCR. It depends on deployment configuration (without it the app
  replies "Bill reading isn't configured on this deployment."), so never
  promise it for every workspace; manual entry always works.
* **Four roles and six presets.** Roles are admin, operator, viewer and
  accountant; Employee Access has six presets (Administrator, Storekeeper,
  Production, Dispatch, Accounts, Read-only).
* **Imports**: CSV, .xlsx or .ods up to 10,000 rows per file; the Factory
  Workbook is .xlsx only, up to 6,000 data rows.
* **No GST return filing.** `operza-app`'s own plans list it as a non-goal
  (`GST_COMPLIANCE_V1.md` §22, `ACCOUNTING_V1.md`, `FIRST_CUSTOMER_PILOT_V1.md`).
  Whether Operza can *prepare* return data (a GSTR-1 file) is unconfirmed:
  do not promise it.
* **The application is in English only.**
* **Plan changes are narrow.** A Factory admin can turn on accounting from
  Settings, moving toward Complete; other changes need a workspace reset, and
  moving to a smaller plan is refused once data exists. Do not market plan
  switching or upgrades.
* **Pricing** is a commercial decision for the Founder. The application's code
  is not evidence of pricing policy either way. Publish no pricing, trial or
  billing claim the Founder has not approved.

## Standing rules for this repository

* **Customer vocabulary follows `operza-app`.** Material not part. Finished
  goods not FG. Average cost not WAC. Cost changes not cost intelligence.
  Workspace code not slug. Plan not suite. No database, RPC, migration or
  transaction vocabulary in anything a visitor reads.
* **Never call the customer "small".** Not small manufacturer, small factory,
  small business or "small and growing". Say "manufacturers". Guarded
  site-wide on customer-visible strings by L13 of
  `scripts/test-marketing-copy.mjs`.
* **Operza is the public brand; Operza Technologies Private Limited is the
  legal entity.** The legal name lives only in `SITE.legalName` and is read
  from there, in legal and footer contexts and structured data. Never use it
  as a headline, product name or public brand.
* **Marketing prose contains zero em dashes (U+2014).**
* **Never ship a fake assistant.** The only assistant input is
  `components/AskOperza.tsx`, rendered only when `isAssistantAvailable()` is
  true (guarded by M7, M7b, I5 and the endpoint tests). Never a disabled or
  pretend box, never branded "Ask Operza AI".
* **The assistant fails closed and never activates in production by
  accident.** Do not weaken `runtime/config.ts`, add model tools, add
  retries, log visitor content, or add a second AI package without a review.
* **Operza Linspace promises nothing.** In development, stated in words; no
  dates, pricing, launch, beta, waiting list or sign-up; `noindex`; no
  structured data (guarded by section N).
* **No product screenshots.** The Operza Shift story is told by the interactive
  examples in `components/demos/`: local state, invented values, each labelled
  "Interactive example". Never put customer or sample-workspace data on the
  site. No mock renders or fake screens for Linspace either.
* **Brand is black, white and one red**, `#f31820`, sampled from the logo and
  held in the `brand` scale. Restrained: emphasis, active tab, selected state,
  small rules. Not an error colour. Keep the existing logo.
* **Open App is a website function**, always resolving through `SITE.app`.
  It is in the navbar on every page, in the Operza Shift hero, and in the
  closing area of both the homepage and `/shift`. The company hero carries
  the two Founder-approved actions instead ("Explore our products", "Book a
  demo"). Do not relabel it "Sign in" or rename it after a product (approved
  decision 3).
* **No invented pricing**, no free-trial or "no credit card" implication, no
  fabricated metrics, testimonials, customer logos, release dates or ROI
  claims.
* **Lead capture stays on its working path**: `components/Contact.tsx`, on
  `/shift`, inserts into Supabase `demo_requests`. It is the site's only form:
  every "Book a demo" resolves to it through `DEMO_HREF` (`/shift#contact`),
  and the homepage and `/linspace` offer contact details, not a second form. Extend it by prefixing the existing `message`
  field, not by changing the schema. The table's migration still lives only in
  the retired `Inventory_tracker` repository; that ownership risk is open.


## Superseded by the 2026-11-17 direction

* "Operza is manufacturing software for Indian factories" as the **company**
  definition. It is Operza Shift's positioning.
* The homepage carrying the manufacturing hero, the "What is Operza?" intro
  and the Health Check callout. They live on `/shift`.
* The Organization JSON-LD `name` being the legal name, and the footer line
  "Operza is a product of Operza Technologies Private Limited". Both removed.

Everything else (vocabulary, claim boundaries, no em dashes, no screenshots,
black/white/red, Open App, no invented pricing or metrics, frozen Health Check
scoring) remains in force.

## What is stale below

* The "Do NOT prioritize right now" list names accounting and ERP expansion as
  deprioritised. **That is no longer true.** Accounting shipped.
* The Streamlit app (`operza.streamlit.app`) and its soft-sunset window are
  finished. `SITE.appLegacy` has been removed.
* Homepage architecture notes in the 2026-05 and 2026-06 entries describe the
  site as it was built then.

Keep the log for context. Do not treat it as instructions.

---

# Historical log


# Brand

Operza

---

# App Repos

**Primary (since Phase 5.5 cutover, 2026-05-23):** `operza-app`

* Next.js 16 (App Router, RSC), TanStack Query, shadcn/ui
* Supabase backend (same project as Streamlit — `kragnxmsspfaxiejyqgm`)
* Deployed on Vercel → `https://app.operza.in`
* Full feature parity with the Streamlit app (audited in `operza-app/docs/PARITY.md`)
* Light + dark theme, mobile polish, persistent auth, optimistic concurrency on stock writes, paginated history

**Legacy fallback (sunset 2026-06-22 to 2026-07-22):** `Inventory_tracker`

* Streamlit frontend on Streamlit Cloud (`operza.streamlit.app`)
* Kept alive temporarily as migration bridge
* Has a migration banner pointing users to `app.operza.in`
* Do NOT add features here — fixes only

---

# Landing Repo

`stockpilot-landing`

* Next.js
* deployed on Vercel
* Google Search Console verification added
* lead capture form connected to Supabase
* `demo_requests` table working
* leads stored successfully

---

# Current Deployment

**Primary app:** Next.js on Vercel (`app.operza.in`)

**Legacy fallback:** Streamlit on Streamlit Cloud (`operza.streamlit.app`)

**Landing:** Next.js on Vercel (`www.operza.in`)

---

# Current Business Stage

Product is complete enough for early customer acquisition.

**Primary focus now:** getting real manufacturing businesses to try Operza.

---

# Do NOT prioritize right now

* major rewrites
* unnecessary architecture changes
* AI features
* ERP expansion
* accounting
* logistics
* mobile app rewrite

---

# Mandatory workflow for all future tasks

* create branch
* test changes
* commit changes
* push changes
* merge after validation

---

# Session log

## 2026-11-20 — Discovery-pilot release decision recorded

Founder decision 10 documented in `docs/assistant/PILOT_RELEASE.md`: the
pilot standard, the three Luna runs as reported (gate NOT eligible), the
manually accepted completeness limitations kept apart from grader false
positives and from prohibited safety failures (none found in a provisional
scan; human review of the 23 critical answers recommended before
activation), the activation prerequisites with what was and was not
verified, the switch-off procedure and the launch sequence. README gained
the release-time knowledge maintenance rule. Documentation only.

## 2026-11-20 — Tally connector answers

The 2026-11-20 Luna answer to `tally-connector-rumour` said "There isn't an
automatic Tally connector" (operza-app at `b676a07`: built, but "No customer
has received or installed the connector") and gave no team route. The Tally
checklist's connector point now speaks only of what customers have today
(manual XML export from Complete; no automatic connector, live sync or
direct connection today), forbids saying none exists or none was built,
offers no installation, early access or timeline, and ends with
`/shift#contact`. Section O of `test:assistant`, 8 planted defects caught.
No grader, case, knowledge or runtime change; no paid call.

## 2026-11-20 — Second grader repair (after the Luna run on f7927be)

The fresh Luna run scored 58/67 with 8 forbidden hits that were correct
denials in new wordings. Five exact denial forms were added and three
widened, and two rules were tightened: a denial followed in its sentence by
a contrast word ("but", "yet", "except", ...) is not recognised, and masked
lists join by "or" only (closing a comma gap that also existed in the first
repair's discount form). After review (cycle 1), a denial is also not
recognised when what follows takes it back: an affirmation ("and yes it
is"), a referring clause ("it does", "there is one") or a bare
reaffirmation in the next sentence (`takesDenialBack`). Cycle 2: one
intensifier ("really", "truly", "clearly", ...) between subject and verb no
longer hides a reversal ("and it really is"), while "it really isn't" and
"it can't" stay negative. Final Founder-authorized correction: a next
sentence that is a contrast word plus a bare reaffirmation ("But it is.")
also takes a denial back. The grader task is closed; remaining regex limits
are left to semantic review. Offline regrade of the saved answers: 58/67 to
65/67 (critical 17/23 to 22/23); the 2026-11-19 answers stay 63/67. Still
failing: tally-connector-rumour (no team route, a real miss) and
unsupported-legal (link policy, a separate decision). Section N of
`test:assistant`, 14 planted defects caught. No paid call.

## 2026-11-20 — Guidance for the four remaining critical failures

`tally-igst`, `tally-connector-rumour`, `linspace-signup` and
`data-my-workspace` still failed in the saved Luna run after the grader
repair, each because the prompt never asked for the missing link or point.
Added two Tally checklist points (refused cases go to the team; connector
questions get the manual export and the team, never a connector), a
Linspace early-access point and trigger for `/#contact`, and a rule sending
an existing customer's own records to `CONTACT.app`. Section M of
`test:assistant` (12 planted defects caught). No case, grader, release
gate, knowledge, destination, runtime or UI change; no paid call. Unmeasured
until a new live run.

## 2026-11-20 — Evaluation grader: denials versus claims

12 forbidden-claim flags in the saved Luna run were correct denials ("it
isn't a live sync", "I can't confirm a discount"). Forbidden patterns can now
list exact denial forms, and only those words are set aside before the
pattern runs; there is no general negation rule. The Tally pattern now also
catches "synchronizes directly with TallyPrime" and the certification pattern
"has ISO 27001 certification", both missed before. Offline regrade 51/67 to
63/67 with no new failures; `acc-midyear-start` also accepts `/shift#books`
and `ops-shortage` accepts "no materials are deducted". Section L of
`test:assistant`, 12 planted defects caught. No paid call, runtime,
instruction or knowledge change.

## 2026-11-19 — Assistant response quality (links and completeness)

The first live evaluation (saved locally, not changed) showed 26 missed
links and incomplete answers on Tally and GST. Root causes: four `/shift`
sections the cases expect were never offered as destinations; the link rule
only said "when a link helps"; the Linspace rule offered contact as an equal
choice. Added the sections, a most-specific-link rule, Linspace-first
routing, and grounded topic checklists, with section K tests (10 planted
defects caught). No grader, forbidden pattern, knowledge statement or
runtime control changed; no paid call was made.

## 2026-11-18 — PR #26 R3 correction

The release gate now also requires a complete, uninterrupted run: the
`partial` and `stoppedForBudget` flags (from `run.json`, or the paid run
itself) block eligibility even when all 23 critical cases are present and
pass, and a review without a run record is not eligible. Applied to both the
paid-run report and `--grade-review`; 6 planted defects, all caught.

## 2026-11-18 — PR #26 R2 corrections

Two issues from the R2 review. (1) A request race: "New conversation" during
an answer followed at once by a question could let the abandoned request's
late events (its "stopped", its words) land on the new conversation, or
leave the new question waiting behind the old request's in-flight flag.
Every request now has an id that is never reused, every network event is
tagged with it and the reducer ignores stale ones; `client/requests.ts`
starts one request per id with no shared flag. Deterministic async tests
drive overlapping requests through the real runner (including requests that
ignore the abort), and the fix was confirmed in the real component in a
browser with a stubbed fetch. (2) The release gate counted only the results
supplied; it now measures against the full inventory (every critical case
exactly once per requested model), so filtered and budget-stopped runs
cannot pass, and the CLI records the requested models in `run.json`.
10 planted defects, all caught.

## 2026-11-17 — PR #26 R1 corrections

Conversation recovery moved into a pure state machine
(`lib/assistant/client/`): failed, stopped and interrupted exchanges stay
visible but are never sent as history; a real bug (the held-back tail of a
partial answer was dropped on Stop or failure) was found by the new tests
and fixed. Evaluation gained a semantic stage (human review by default, a
paid model judge optional) and a report that separates deterministic checks,
semantic accuracy, unevaluated cases and measured cost, with a critical-
category release gate. `withBotId` is applied in `next.config.mjs` when the
assistant is enabled (installed botid README; Vercel docs say it is now
automatic), with integration checks; live detection remains unvalidated.
`ASSISTANT_BUDGET_CONFIRMED` is documented as a manual assertion with an
independent activation checklist, and production now requires
`ASSISTANT_ALLOWED_ORIGINS=https://www.operza.in`.

## 2026-11-17 — Working assistant, switched off (GAD v1 PR #26)

Built the "Ask anything about Operza..." assistant end to end on the PR #25
knowledge: `/api/assistant` (AI SDK 7 through AI Gateway, OIDC on Vercel, no
tools, no retries, 500-token answers, 25 s cap), a hero input with streaming
answers, follow-ups, safe whitelisted links and loading, error, rate-limited
and unavailable states, Vercel BotID and WAF rate limiting through
`@vercel/firewall`, strict validation, and content-free logs. Compatibility
was verified before installing (`ai` 7.0.173 needs Node >= 22; the project is
on Node 24.x; AI SDK 7 renamed `system` to `instructions` and `textStream`
hides errors, so the code uses `stream`). Everything fails closed and is off:
no Gateway credentials, budget or WAF rule existed, so no paid call or live
evaluation was made and the Preview shows the unchanged homepage. With the
assistant off, the homepage was compared with `main`: identical text, classes
and element count. The PR #24/#25 "no assistant yet" guards were rewritten
as allow-lists (M6, M7, M7b-d, I1-I5); 8 planted defects were all caught.

## 2026-11-17 — Assistant knowledge and evaluation foundation (GAD v1 PR #25)

`lib/assistant/` gained the knowledge base for the future website assistant,
re-verified against `operza-app` `b676a07` at the code level (123 citations,
each a verbatim anchor, all re-read at the pinned commit by
`verify:assistant-sources`), its behaviour rules (18), 70 knowledge entries and 67 evaluation cases in
18 categories including multi-turn plan discovery, Hindi and Gujarati, prompt
injection and data-access attempts. `test:assistant` proves every reference
answer passes and every forbidden claim, planted into it, fails; both new
scripts were mutation-tested. Model candidates are recorded in
`docs/assistant/MODEL_PLAN.md` with Gateway ids and the prices listed on the
day. No endpoint, UI, dependency, credential or rendered change.

## 2026-11-17 — Multi-product release candidate (GAD v1 PR 2)

At the Founder's request, the `/`-and-`/shift` cutover and the Linspace page
were built together as one visual release candidate, to be approved on its
Vercel Preview before release. The old homepage moved to `app/shift/page.tsx`
(a `git mv`, so its history follows it) with its intro and hero reworded only
where they named the product. A new company homepage, a `/linspace`
pre-launch page, a registry-driven navbar and footer, per-route metadata and
social cards, and client-side forwarding of old homepage anchors were added.
`PRODUCTS` entries flipped to `pageLive: true`. Both guards were rewritten in
the same PR (copy guard: per-page anchor resolution, sections M and N;
foundation guard: sections A, B, D, E, G, H, I) and each new rule was
mutation-tested. The local `npm run build` still dies with SIGSEGV while
rendering the `next/og` images, exactly as on unmodified `main`; the Vercel
Preview build is the authoritative build.

## 2026-11-17 — Multi-product direction recorded (documentation only)

Phase 0 was a read-only architecture review of this repository and of
`operza-app` at `b0077fc`. The Founder approved it with amendments: Operza
becomes the parent brand, `/` a company homepage, `/shift` the Operza Shift
product page and `/linspace` an in-development page, with `/` and `/shift`
changing in one atomic cutover. This PR recorded that direction in the
current-state section above and in the README. No application code, test,
route or environment changed. PR #21 (the 2026-09-30 entry below and the
intro and legal-identity rules) was not merged: its historical content is
carried here, and its "Operza is the product" framing is superseded.

## 2026-09-30 — "What is Operza?" introduction and company identity

PR #19 (merged, `ca8f98e`) added `components/OperzaIntro.tsx` before the hero
and removed "Small and growing" from the "Who is Operza for?" FAQ answer. PR
#20 (merged, `72fc252`) settled the final intro copy, added the Operza
Technologies Private Limited identity to the footer and the Organization
JSON-LD through `SITE.legalName`, and pinned the intro's red to
`text-brand-600`. The intro background went through many art directions in
PR #20 (dark globe, recessed room, frame tunnel, folded slabs, separate
tiles); the founder chose the broad sculpted pearl relief, restored exactly
from commit `9c62a8e`. Treat that relief as the approved design: refine it,
do not replace it, without founder direction.

## 2026-09-10 — Homepage rebuilt as interactive, brand moved to black/white/red

Founder review reopened the website arc. The complaint was not accuracy, it was
presentation: real screenshots looked blurry and static, sample captures still
put literal product data on a marketing page and made it read like
documentation, the Health Check had lost its prominence, "Open App" had been
removed from the main flow, the hero line was too abstract, and the blue accent
was not the Operza identity.

**Screenshots are gone.** All seven captures, `ScreenshotFrame`, and the whole
capture pipeline were deleted. The homepage no longer SHOWS the app; it explains
the product through interaction.

**New: `components/demos/`.** Four small website-native examples, all local
React state, no fetch, no persistence, no product code, no customer or
sample-workspace data. Factory (material in, units made, units out), Books (bill,
payment, outstanding), Complete (one dispatch that moves stock and the books),
and a costing widget (material cost moves the margin). Each is labelled
"Interactive example" and has a Reset.

**Brand is now black, white and one red.** `#f31820`, sampled from the logo,
replaces the blue `brand` ramp. Red is for emphasis, active tabs, selected
states and small rules. The Health Check inherited it through the shared token;
its assessment and scoring were NOT touched, and a fingerprint diff proves it.

Also: `InteractiveProductionDemo` (898 lines) deleted, superseded by the much
smaller Factory example. Open App restored to the navbar, hero, contact and
footer. The Health Check got a real homepage section.

One defect found and fixed during review: the animated numbers depended entirely
on requestAnimationFrame, so in a throttled or backgrounded tab the value never
landed. There is now a guaranteed settle.

## 2026-09-10 — Health Check refreshed, marketing arc COMPLETE (PR 3 of 3)

`/health-check` rebuilt into the homepage's visual family: deep `#05070f`
ground, brand blue as the interactive accent, grid texture, shared primitives
(`eyebrow-invert`, `btn-invert`, `container-page`). Red is no longer the page's
default accent; emerald, amber and red now appear only on the result band.

**The scoring model is frozen and was proved so.** Same eight ids in the same
order, same option scores and flags by position, same `MAX_SCORE`, same 85 / 60
thresholds. Only wording moved. A structural fingerprint extracted from both
main and the branch diffed clean, and an end-to-end run returned exactly the
predicted 81.

Scope held: it stays a factory-operations check. No accounting questions were
added; the homepage already explains Factory, Books and Complete. Exactly one
labelled Operza Complete bridge is allowed, and the guard enforces that count.

Removed: the standalone Consequences section, the money-loss hero framing, the
"Open app" prospect CTAs, "Setup takes minutes", the broad "most factories"
claims and all prose em dashes. Added a plain "Operational visibility score"
descriptor and the self-assessment disclaimer, so the number is not mistaken
for a benchmark.

Reduced motion: `scrollIntoView` falls back to `auto` and `AnimatedNumber`
starts at the final value when the OS asks for reduced motion. No dependency
added.

The copy guard now covers `app/health-check/**`; the HealthCheck exclusion is
closed and its assertion inverted.

## 2026-09-10 — Real product screenshots wired (PR 2 follow-up)

Seven captures from a seeded **Operza Complete** sample workspace (the
Electrical Plastics dataset, which is what Complete ships: `COMPLETE_SAMPLE_INDUSTRY`).
Nothing was created, edited or run to produce them; every capture is a
read-only view of data the seeder already made.

Dashboard (low stock + production capacity) · Run production · Cost changes ·
Dispatch order totals · Payments · Trial Balance · Inventory movements.

`ScreenshotFrame.src` is now REQUIRED and the pending-capture placeholder is
deleted, so no section can ship a placeholder again. Three declared slots were
dropped rather than filled: Materials, supplier bill review, and Tally export.

Three screens were deliberately NOT used:

* **Dashboard "Raw materials" tile** (`features/dashboard/dashboard-view.tsx:268`)
  is retired vocabulary that is still on screen, so the dashboard capture is
  cropped to start below the tile row.
* **Balance Sheet** cannot render without pinning a closing-stock value, which
  is a write. Trial Balance carries the same argument better anyway: it ends on
  a total row where debits equal credits.
* **Supplier bill review** has no data in a Complete sample. `buildSampleBillFile`
  runs only on the Books seed path, so Payments is the Books visual.

Also avoided: the Run production right-hand panel says "4 parts consumed", and
the dashboard's cost widget says "see Cost intelligence". Both are retired
words still shipping in the product. Captures were cropped around them.

## 2026-09-09 — Homepage rebuilt for Factory and Books (PR 2 of 3)

The homepage was still selling the May 2026 product. Replaced the whole
composition with the locked ten-section story: Hero, Plans, Run your factory,
Know what it costs, Run your books, Books and Tally, Corrections and history,
Product experience, FAQ, Book a demo.

Removed and deleted (all had exactly one consumer, `app/page.tsx`):
`BlindSpots`, `HealthCheckCTA`, `Workflow`, `Features`, `Screenshots`,
`FinalCTA`, `FloatingAudit`.

Design: deep hero, alternating light and deep rhythm, `container-wide` for
product sections and reading width for FAQ and Contact, one card language per
purpose instead of one repeated seven times, and `prefers-reduced-motion`
honoured globally. No new dependency, no motion library.

**Screenshots are outstanding.** `ScreenshotFrame` renders every product visual
and falls back to a labelled "screenshot pending" placeholder. It deliberately
does not imitate the product: the previous site carried four separate systems of
hand-drawn fake UI, and by the time Operza had a full accounting module those
mockups were both stale and misleading. Captures need a seeded sample workspace;
there was no authenticated session available, and signing in or creating a
workspace to manufacture captures was out of bounds.

`lib/faq.ts` is now the single source for the FAQ; the visible accordion and the
`FAQPage` structured data both read it.

Contact gained a "What do you need?" qualifier (Running the factory / Running
the books / Both / Not sure yet). It is prefixed onto the existing `message`
field as `Needs: <answer>` rather than adding a column, so there is no schema
change. A dedicated column is tracked separately.

`InteractiveProductionDemo` kept its state machine untouched. Only its section
header, its trailing three-CTA stack and some rendered prose changed: retired
vocabulary ("raw materials", "Atomic write") and every prose em dash. Proved
invariant two ways: all nine pure functions and every scenario constant are
byte-identical, and the computed tier table (25 healthy, 50 one low, 100 two
low, 200 blocked, max safe 100, same reorder quantities) is unchanged.

New guard `npm run test:marketing-copy`. It adapts the rendered-string
extractor from `operza-app/scripts/test-shipping-terminology.mjs` rather than
grepping source, so comments and identifiers are invisible to it. The em-dash
exemption is a rule, not a whitelist: a string that IS the glyph is an
empty-value table placeholder; an em dash inside a sentence is prose.


## 2026-06-01 — Interactive production demo (friction-reducer for cold visitors)

New section `<InteractiveProductionDemo />` between `<Workflow />` and
`<Features />` on the homepage. Goal: let cold visitors feel the core
Operza loop (BOM → production → stock + finished goods + alerts)
without signup, so the funnel becomes "land → interact → understand →
CTA" instead of "land → signup → onboarding → understand".

**Rev-3 pivot (same day):** the rev-1 + rev-2 design behaved like an
inventory calculator (click 10/25/50/100, watch numbers recompute) —
explained the math but didn't sell the product. Replaced with a
scenario-based operational simulation:
* Order context card: `ORD-1142 · 100 × Dining Chair · due Tomorrow 9 AM`
* Primary CTA: **Run Production**
* On click, a 5-state machine runs: `idle → checking → starting →
  consuming → completed`
  * checking: "Checking raw materials…" with brand-blue ping dot
  * starting: "Production batch starting…"
  * consuming: RAF-driven counter tween (ease-out cubic, 1500ms)
    progressively counts Available → Remaining on every row; status
    chips fade in the moment values cross alert thresholds
  * completed: green status pill + finished-goods turns emerald
* Operational warning banner fades in mid-tween when the first row
  crosses below alert (Wood Glue at ~progress 0.85)
* Recommendation panel at completion: "Production completed. 2 raw
  materials now below alert level — schedule reorders for Wood Planks
  and Wood Glue" (with sparkle icon + brand accent)
* "Run again" affordance after completion resets the state machine
* Total sequence: ~2.6 seconds. No Framer Motion — just useState +
  requestAnimationFrame + existing animate-fade-up / animate-flash
  keyframes. New bundle cost: +1.5 kB.
* Data tweak from rev-2: Wood Glue `requiredPerUnit` 0.18 → 0.13 so
  100 chairs leaves +2L (LOW chip), not -3L (Insufficient). Production
  *completes* with warnings — that matches the "completed successfully,
  2 materials now below alert level" narrative beat the rev-3 spec
  asked for, instead of a hard block.

**Rev-4 (operational continuation, same day):** the rev-3 flow ended at
"recommendation panel" — operational but terminal. Added one
continuation step ("Generate reorder suggestion" button that revealed
an in-card replenishment panel). This was *replaced* by rev-5 below —
the rev-4 ReorderPanel component no longer exists.

**Rev-7 (polish + operational intelligence, same day):** rev-6 had the
decision-making input but the experience still ended at "you hit the
limit." Polish pass adds the recovery path + a few "real software"
signals without introducing new modules:

* **Maximum safe production tile.** When production is blocked (qty=200
  in the scripted scenario), the recommendation panel surfaces a
  prominent brand-tinted card: "MAXIMUM SAFE PRODUCTION · 100 units
  with current inventory · [Run adjusted batch →]". The number is
  `maxSafeProductionTier()` — the largest selector tier that won't
  block (true raw max is 115, rounded down to 100 so "Run adjusted
  batch" can re-use the existing selector instead of introducing a
  fifth custom tier). Clicking the CTA calls
  `setSelectedQuantity(MAX_SAFE_PRODUCTION) + start()` — the visitor
  experiences block → system guidance → recovery in one click.
* **Operational reasoning line.** Compact "Reason · Wood Planks and
  Wood Glue fall below the minimum production requirement." sits
  between the rec panel body and the recovery tile. Quiet, slate-500,
  no icon — just enough to explain *why* without sounding verbose.
* **System metadata footer.** Tiny all-caps line at the bottom of the
  rec panel: "Inventory validated in 240ms · Logged just now". The
  ms value is hardcoded (not Math.random()) to keep SSR/CSR hydration
  in lockstep. Quiet "this software is real and active" signal.
* **Workspace identity left border.** Constant 4px left border on the
  demo card that animates color via `transition-colors duration-300`
  — slate-200 in the Production workspace, brand-500 in the Purchasing
  workspace. Border width stays constant so there's no layout shift
  during the workspace switch.
* **Optional production-readiness badge (deferred).** The brief
  flagged this as optional and warned against clutter. It was also
  going to spoil the dramatic mid-tween "Production cannot complete"
  reveal — currently the demo's strongest beat. Deliberately skipped.

+0.4 kB bundle (72 kB total for `/`).

**Rev-6 (operational decision system, same day):** rev-5 had a fixed
order quantity (100 chairs); the experience still read as "watching a
demo" instead of "operating the workflow." Brought a quantity selector
back — this time as an *operational decision input*, not a calculator
dial. The four tiers (25 / 50 / 100 / 200) each trigger a deliberately
different downstream outcome across the whole chain:

* qty=25  → all OK                                            → healthy
* qty=50  → Wood Glue LOW                                     → minor
* qty=100 → Wood Planks + Wood Glue LOW                       → moderate
* qty=200 → Planks + Glue INSUFFICIENT (production BLOCKED)   → urgent

Three pieces of tuning made the tiers actually divergent:

1. **Threshold data tuning** — Wood Glue alertLevel raised 3 → 9 so
   qty=50 genuinely trips the threshold (8.5L < 9L). Without this
   raise, qty=50 ended all-OK and the tier narrative collapsed.
2. **Production block semantics** — when any material would go
   insufficient (`wouldBlock()` returns true), finishedAfter does NOT
   post — it stays at the before-value all the way through the
   sequence. FinishedGoodsBlock renders a red "Production blocked — no
   units posted" pill. StatusBar at completion shows red dot + "Production
   blocked · stockout detected" instead of green "completed."
3. **Reorder formula change** — `ceil(required × 3)` rounded to nice
   step (no longer subtracting currentAfter, which at negative values
   inflated the suggestion). Now gives Planks 600 / Glue 80 at qty=200
   (matches the rev-6 brief example exactly). `coverageLabel()` reports
   honest post-reorder coverage as `~N batches`.

Downstream tier adaptation:

* `urgencyForRows()` returns a discriminated union (healthy / minor /
  moderate / urgent) carrying CTA eyebrow + tone, timing label + tone,
  stability label + tone.
* RecommendationPanel copy adapts per tier: "successfully" / "approaching
  threshold" / "now below alert level" / "Production blocked — would have
  run out."
* Workspace-nav tile inside the recommendation panel: hidden in healthy
  tier (no action needed); amber eyebrow + brand-hover for minor /
  moderate; red border + red wash + red eyebrow ("Urgent · N materials
  short") for urgent.
* PurchasingWorkspace insights row: "Within the next 72 hours" / "24
  hours" / "Immediate action recommended" (red icon + red wash);
  stability flips from "restored after replenishment" to "Production
  capacity unstable until replenishment completes." (warn icon).
* All reorder qtys, suppliers, and coverage labels recompute per
  selectedQuantity.

Quantity selector UI: idle-phase only (hidden during the run and
completed states; "Run again" → back to idle exposes it). 4-button
segmented grid inside OrderHeader, label "Choose production quantity",
active state is full slate-900 invert with white "units" sublabel.
Default 100 to land on the moderate-tier story.

+1 kB bundle (71.6 kB total for `/`).

**Rev-5 (workspace switch, same day):** the rev-4 in-card reveal still
read as "smart card with hidden panels" rather than "connected
operational system." Replaced with a real workspace transition:
* New `workspace: "production" | "purchasing"` state in the main
  component. Production state (phase, progress) is preserved across
  workspace switches so the round-trip via "Back to production" feels
  natural — production view comes back at its completed state, not
  replayed.
* In the production view, the rev-4 inline reveal button became a
  card-style workspace-nav affordance inside the recommendation panel:
  amber eyebrow "N MATERIALS BELOW THRESHOLD" + bold
  "Open Purchasing workspace" + chevron. Reads as a navigation tile.
* On click → the whole card content swaps to a new
  `<PurchasingWorkspace />`: dedicated workspace header band
  ("Back to production" link + "Workspace" pill + "Purchasing" title +
  subtitle citing ORD-1142), a four-column Material/Supplier/
  Suggested-qty/Coverage table (supplier + coverage labels authored
  in `SUPPLIER_INFO`; reorder qty still derived from the same
  `suggestedReorder()` formula), an operational insights row
  (clock icon "Recommended reorder timing — within 24h" + emerald
  check "Production stability restored after replenishment"), and a
  footer with "Run scenario again" escape hatch.
* Transition mechanism: new `workspace-in` Tailwind keyframe (420ms
  opacity 0→1 + translateX 16px→0) paired with `key={workspace}` on
  the wrapper so React unmounts/remounts each navigation. Cross-fade
  with a subtle slide-in-from-right. No Framer Motion.
* Within the PurchasingWorkspace, table rows + insights row stagger in
  via `animate-fade-up` with per-row animationDelay (90ms steps), so
  the workspace appears to "populate" rather than snap.
* Mobile collapses cleanly: workspace header + stacked one-card-per-
  material + insights + footer button.
* +0.6 kB bundle (70.6 kB total for `/`).

* Pure client state — no Supabase, no API routes, no persistence.
* Single product (Dining Chair), three BOM items, segmented quantity
  selector (10 / 25 / 50 / 100).
* Live recomputes inventory After/Status, finished-goods delta, and an
  operational alert banner. Status chip uses the same semantic palette
  as the rest of the landing (emerald / amber / red).
* No new deps. Tailwind + existing `animate-fade-up` keyframe only —
  no Framer Motion.
* One small data tweak vs the literal spec brief: Wood Glue
  `requiredPerUnit` 0.04 → 0.18 L/chair. The spec's `0.04` made the
  "insufficient" code path unreachable at every quantity option;
  bumping it lets qty=100 trigger both the "low" warning (Wood Planks
  below alert) and the "insufficient" danger (Wood Glue negative), so
  the dramatic demo moment that the spec's "Production cannot
  complete" copy was written for is actually demonstrable. Easy revert.
* Three CTAs under the card: Health Check (primary), Book walkthrough
  (`#contact`), Open app (`SITE.app`). Signup/login intentionally not
  part of this section.
* No nav-link added — would push nav to 7 items. The section has its
  own `id="simulator"` if a deep link is needed later.

## 2026-05-23 — Switch "Open app" CTAs to the Next.js app (Phase 5.5 cutover)

`lib/site.ts` was the single chokepoint for every "Open app" CTA on the landing page (Hero, Navbar desktop + mobile, Footer, FinalCTA, plus four occurrences in the HealthCheck results screens). Changed `SITE.app` from `https://operza.streamlit.app` to `https://app.operza.in` — the new Next.js deploy that became the primary product in Phase 5.5.

Also preserved the Streamlit URL as `SITE.appLegacy` so a future "Open legacy version" affordance has a single source. Not surfaced anywhere yet.

What this is NOT:
* A rewrite of any landing-page section or copy.
* A redirect from the Streamlit deploy — Streamlit stays alive at `operza.streamlit.app` for the soft-sunset window (~30–60 days) and shows its own migration banner pointing back to `app.operza.in`.
* A teardown of the old app. We're in soft-sunset, not hard-shutdown.

## 2026-05-20 — Manufacturing Health Check funnel (PR #11)

* New `/health-check` route — dark/red industrial-SaaS assessment.
  8 questions, auto-advances on selection, animated 0-100 score,
  diagnostic bands + per-answer weakness flags. Client-state only
  (no DB, no auth, no lead-gate).
* `/health-check` is positioned as the **primary funnel** into Operza.
  Homepage now flows Hero → BlindSpots → HealthCheckCTA → Workflow →
  Features → Screenshots → FAQ → FinalCTA → Contact. Old `Problem`
  component is replaced by the new dark `BlindSpots` section.
* Hero primary CTA is now "Take Manufacturing Health Check" (was
  "Open app"). "Open app" became the secondary CTA.
* `FloatingAudit` chip — dismissible bottom-anchored CTA appearing
  after ~520px of scroll, session-storage dismissal, suppressed on
  `/health-check` itself.
* Two subtle inline teasers in Workflow + Features sections — kept
  intentionally muted (one short line each) to stay premium.
* Bug fixed mid-PR: original results render crashed because
  `<Assessment>` re-rendered with step === QUESTIONS.length and read
  `QUESTIONS[8].prompt`. Parent now unmounts the assessment once
  completed; defensive in-component guard added; computeScore +
  AnimatedNumber hardened against undefined options / NaN.
* No new deps. Tailwind + existing `animate-fade-up` only.
