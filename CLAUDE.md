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
