# Brand

Operza

---

# App Repo

`Inventory_tracker`

* Streamlit frontend
* Supabase backend
* Auth system
* password reset
* raw material tracking
* BOM creation
* production tracking
* automatic raw material deduction
* finished goods tracking
* inventory logs
* production logs
* finished goods logs
* low stock alerts
* CSV exports
* demo onboarding

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

**App:** Streamlit

**Landing:** Vercel

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
