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
