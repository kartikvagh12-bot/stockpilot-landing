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
continuation step so the scenario reads as an ongoing factory rather
than a one-shot demo:
* New "Generate reorder suggestion" button inside the recommendation
  panel (only renders when there are low/insufficient materials,
  i.e. always given the scripted scenario).
* On click → reveals a `<ReorderPanel />` below: brand-50/30 wash,
  package icon, a small white-card list of items with their suggested
  reorder quantities, an "Estimated coverage · ~3 future production
  batches" footnote, an operational explanation line, and a brand-100
  pill with a clock icon: "Recommended reorder timing — within the
  next 24 hours."
* Suggested quantities are *derived*, not hardcoded:
  `ceil((3 × required) − currentAfter)` rounded up to a nice unit step
  (50 for pcs, 5 for L). At the scripted scenario this yields Wood
  Planks 300 pcs / Wood Glue 40 L — which actually covers 3 future
  batches, so the marketing claim matches the data.
* `reorderRevealed` state is cleared by both `start()` and `reset()`
  so Run Again replays the whole sequence cleanly.
* +0.5 kB bundle (70 kB total for `/`).

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
