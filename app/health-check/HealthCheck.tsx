"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/lib/site";

// ─────────────────────────────────────────────────────────────────────────────
// Assessment data
// ─────────────────────────────────────────────────────────────────────────────
// Each option carries a 0-3 score and an optional `flag` that surfaces a
// specific operational weakness in the results card. Max possible score
// across 8 questions = 24, normalized to 0-100 for the headline number.

type Option = { label: string; score: number; flag?: WeaknessFlag };
type Question = { id: string; prompt: string; options: Option[] };

type WeaknessFlag =
  | "spreadsheet_risk"
  | "manual_dependency"
  | "no_system"
  | "shortages_frequent"
  | "shortages_occasional"
  | "visibility_lag"
  | "no_visibility"
  | "partial_bom"
  | "manual_bom"
  | "no_bom"
  | "key_person_risk"
  | "key_person_critical"
  | "no_finished_tracking"
  | "no_alerts"
  | "low_confidence"
  | "estimating";

const QUESTIONS: Question[] = [
  {
    id: "tracking",
    prompt: "How do you currently track inventory?",
    options: [
      { label: "Excel spreadsheets", score: 1.5, flag: "spreadsheet_risk" },
      { label: "WhatsApp / verbal updates", score: 0.5, flag: "manual_dependency" },
      { label: "Notebook or paper register", score: 0.5, flag: "manual_dependency" },
      { label: "ERP or dedicated software", score: 3 },
      { label: "No structured system", score: 0, flag: "no_system" },
    ],
  },
  {
    id: "shortages",
    prompt: "Have you ever run out of raw materials unexpectedly?",
    options: [
      { label: "Frequently", score: 0, flag: "shortages_frequent" },
      { label: "Sometimes", score: 1, flag: "shortages_occasional" },
      { label: "Rarely", score: 2 },
      { label: "Never", score: 3 },
    ],
  },
  {
    id: "stock_check",
    prompt: "Can you instantly check current stock levels right now?",
    options: [
      { label: "Yes — anytime, anywhere", score: 3 },
      { label: "Only by asking staff", score: 1, flag: "visibility_lag" },
      { label: "Sometimes — depends who's around", score: 1.5, flag: "visibility_lag" },
      { label: "No", score: 0, flag: "no_visibility" },
    ],
  },
  {
    id: "bom",
    prompt: "Do you track production consumption per product (BOM)?",
    options: [
      { label: "Yes — formal BOMs per product", score: 3 },
      { label: "Partially — only for some products", score: 2, flag: "partial_bom" },
      { label: "Manually — on paper or by memory", score: 1, flag: "manual_bom" },
      { label: "No", score: 0, flag: "no_bom" },
    ],
  },
  {
    id: "key_person",
    prompt: "What happens if your inventory manager is absent for a day?",
    options: [
      { label: "Operations continue smoothly", score: 3 },
      { label: "Delays happen, but we manage", score: 2, flag: "key_person_risk" },
      { label: "We struggle to find information", score: 1, flag: "key_person_risk" },
      { label: "Major disruption — work halts", score: 0, flag: "key_person_critical" },
    ],
  },
  {
    id: "finished_goods",
    prompt: "How do you track finished goods?",
    options: [
      { label: "Dedicated software", score: 3 },
      { label: "Spreadsheet", score: 1.5, flag: "spreadsheet_risk" },
      { label: "Manual counting", score: 1, flag: "manual_dependency" },
      { label: "We don't track properly", score: 0, flag: "no_finished_tracking" },
    ],
  },
  {
    id: "alerts",
    prompt: "Do you receive low-stock alerts automatically?",
    options: [
      { label: "Yes", score: 3 },
      { label: "No", score: 0, flag: "no_alerts" },
    ],
  },
  {
    id: "visibility_confidence",
    prompt: "How confident are you in your overall operational visibility?",
    options: [
      { label: "Very confident", score: 3 },
      { label: "Somewhat confident", score: 2 },
      { label: "Not confident", score: 1, flag: "low_confidence" },
      { label: "We mostly estimate", score: 0, flag: "estimating" },
    ],
  },
];

const MAX_SCORE = QUESTIONS.length * 3;

// Each flag maps to a one-line weakness statement shown in the results card.
// Phrasing is diagnostic, not accusatory — "uses X" not "you don't have Y".
const WEAKNESS_COPY: Record<WeaknessFlag, string> = {
  spreadsheet_risk:
    "Spreadsheet-based tracking — version drift and human-error risk compound silently.",
  manual_dependency:
    "Heavy reliance on manual records — slow lookups, easy to lose, hard to audit.",
  no_system: "No structured tracking system — visibility depends entirely on memory.",
  shortages_frequent:
    "Frequent unplanned raw-material shortages — reorder triggers aren't working.",
  shortages_occasional:
    "Occasional stockouts — reorder points are reactive, not predictive.",
  visibility_lag: "Stock visibility depends on asking staff — answers lag reality.",
  no_visibility: "No way to verify current stock levels — every count is a guess.",
  partial_bom: "Partial BOM coverage — consumption math doesn't tally across products.",
  manual_bom:
    "BOM tracked on paper — production doesn't update inventory automatically.",
  no_bom: "No BOM tracking — finished goods produced without verified consumption.",
  key_person_risk:
    "Operations slow when the inventory manager is unavailable — knowledge isn't shared.",
  key_person_critical:
    "Operations halt without one person — single point of failure in your supply chain.",
  no_finished_tracking:
    "Finished goods aren't reliably tracked — hard to commit to delivery windows.",
  no_alerts:
    "No automatic low-stock alerts — shortages surface only when work has already stopped.",
  low_confidence:
    "Low confidence in operational data — decisions made on incomplete information.",
  estimating: "Decisions driven by estimates rather than verified counts.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

type Band = {
  label: string;
  accent: "good" | "warn" | "alert";
  headline: string;
  body: string;
};

function bandFor(score: number): Band {
  if (score >= 85) {
    return {
      label: "Operationally Structured",
      accent: "good",
      headline: "Your operation is in good shape.",
      body:
        "You've already removed most of the manual dependencies that hold factories back. The next gains come from tightening real-time visibility and connecting your floor data to decisions.",
    };
  }
  if (score >= 60) {
    return {
      label: "Moderate Operational Risk",
      accent: "warn",
      headline: "Solid foundation, but blind spots are quietly costing you.",
      body:
        "Most of the basics are in place, but specific gaps are creating drag — small material shortages, delayed answers, and decisions made on stale data. The patterns below are common at this stage.",
    };
  }
  return {
    label: "High Operational Blind Spots",
    accent: "alert",
    headline: "Your operation is running on memory and goodwill.",
    body:
      "Critical operational data lives in people's heads, on paper, or in spreadsheets no one trusts. This is survivable at small scale, but every order you take adds more risk. The patterns below are what tends to break first.",
  };
}

function computeScore(answers: (number | null)[]) {
  let sum = 0;
  const flags = new Set<WeaknessFlag>();
  QUESTIONS.forEach((q, i) => {
    const idx = answers[i];
    if (idx == null) return;
    const opt = q.options[idx];
    sum += opt.score;
    if (opt.flag) flags.add(opt.flag);
  });
  const normalized = Math.round((sum / MAX_SCORE) * 100);
  return { normalized, flags: Array.from(flags) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function HealthCheck() {
  const [step, setStep] = useState<number>(-1); // -1 = not started; 0..7 = Qn; 8 = done
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(QUESTIONS.length).fill(null),
  );

  const assessmentRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const completed = step >= QUESTIONS.length;
  const { normalized, flags } = useMemo(
    () => computeScore(answers),
    [answers],
  );
  const band = useMemo(() => bandFor(normalized), [normalized]);

  function start() {
    setStep(0);
    setTimeout(
      () =>
        assessmentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      40,
    );
  }

  function answer(optionIdx: number) {
    const next = [...answers];
    next[step] = optionIdx;
    setAnswers(next);
    // Brief delay so users see the selection register before the card flips.
    window.setTimeout(() => {
      setStep((s) => Math.min(s + 1, QUESTIONS.length));
    }, 220);
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function restart() {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setStep(0);
    setTimeout(
      () =>
        assessmentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      40,
    );
  }

  // Scroll results into view once revealed.
  useEffect(() => {
    if (completed) {
      const id = window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
      return () => window.clearTimeout(id);
    }
  }, [completed]);

  return (
    <div className="health-check min-h-screen bg-black text-white antialiased">
      <Header />

      <main>
        <Hero onStart={start} />
        <Intro />
        <section
          id="assessment"
          ref={assessmentRef}
          className="relative scroll-mt-20 border-t border-white/5 py-20 sm:py-24"
        >
          <Assessment
            step={step}
            answers={answers}
            onStart={start}
            onAnswer={answer}
            onBack={back}
          />
        </section>

        {completed && (
          <div ref={resultsRef} className="scroll-mt-20">
            <Results
              score={normalized}
              band={band}
              flags={flags}
              onRestart={restart}
            />
            <Consequences />
            <Solution />
            <CTA />
          </div>
        )}
      </main>

      <FooterLite />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/70 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Operza home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/operza-logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold tracking-tight">Operza</span>
        </Link>
        <a
          href={SITE.app}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          Open app
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Industrial grid texture, fading toward the bottom so it doesn't
          fight with content below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
        }}
      />
      {/* Soft red glow behind the title, evokes industrial signal lights. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl"
      />

      <div className="container-page pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Operational Audit · 60 seconds
          </span>
          <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem]">
            Is your factory{" "}
            <span className="text-white/55">quietly losing money?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            Eight questions. No signup. A free operational snapshot showing
            where small inventory and production blind spots are silently
            costing you time, materials, and margin.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
            >
              Start assessment
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#what-it-checks"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/20 hover:bg-white/[0.05] sm:w-auto"
            >
              What it checks
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/45">
            <li className="inline-flex items-center gap-2">
              <Dot /> Anonymous
            </li>
            <li className="inline-flex items-center gap-2">
              <Dot /> No email required
            </li>
            <li className="inline-flex items-center gap-2">
              <Dot /> Instant results
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intro
// ─────────────────────────────────────────────────────────────────────────────

function Intro() {
  return (
    <section
      id="what-it-checks"
      className="border-t border-white/5 py-16 sm:py-20"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-10 sm:grid-cols-3">
            <IntroPoint
              n="01"
              title="Most factories rely on memory"
              body="Inventory sits in someone's head, a notebook, or a spreadsheet only one person fully understands."
            />
            <IntroPoint
              n="02"
              title="Inefficiencies compound silently"
              body="A missed reorder. A delayed answer. A wrong count. None of it shows up on a P&L line — until it does."
            />
            <IntroPoint
              n="03"
              title="Small gaps break production"
              body="Material shortages, missed deliveries, and rework almost always trace back to operational blind spots."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function IntroPoint({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-500/80">
        {n}
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assessment
// ─────────────────────────────────────────────────────────────────────────────

function Assessment({
  step,
  answers,
  onStart,
  onAnswer,
  onBack,
}: {
  step: number;
  answers: (number | null)[];
  onStart: () => void;
  onAnswer: (i: number) => void;
  onBack: () => void;
}) {
  if (step < 0) {
    return (
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
            Step 01
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mt-4 text-base text-white/60">
            Eight quick questions about how your factory tracks materials,
            production, and finished goods.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Begin
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // step is clamped to [0, QUESTIONS.length] elsewhere; the completed branch
  // is unmounted by the parent, so this only renders while step < length.
  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const selected = answers[step];

  return (
    <div className="container-page">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/55">
            Question {String(step + 1).padStart(2, "0")}{" "}
            <span className="text-white/30">
              / {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className="text-xs font-medium text-white/55">
            {Math.round(((step + 1) / total) * 100)}%
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question card (keyed to step so it remounts + replays fade) */}
        <div
          key={step}
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 animate-fade-up"
        >
          <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
            {q.prompt}
          </h2>

          <ul className="mt-7 space-y-2.5">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <li key={opt.label}>
                  <button
                    type="button"
                    onClick={() => onAnswer(i)}
                    aria-pressed={isSelected}
                    className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-red-500/60 bg-red-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/85 hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "border-red-500 bg-red-500"
                            : "border-white/30 bg-transparent group-hover:border-white/50"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {opt.label}
                    </span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 shrink-0 transition ${
                        isSelected
                          ? "translate-x-0.5 opacity-100 text-red-300"
                          : "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={step === 0}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                step === 0
                  ? "cursor-not-allowed text-white/20"
                  : "text-white/55 hover:text-white"
              }`}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <div className="text-xs text-white/35">
              {selected != null
                ? "Recorded — advancing…"
                : "Pick the closest match"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

function Results({
  score,
  band,
  flags,
  onRestart,
}: {
  score: number;
  band: Band;
  flags: WeaknessFlag[];
  onRestart: () => void;
}) {
  const accentRing =
    band.accent === "good"
      ? "ring-emerald-500/40"
      : band.accent === "warn"
        ? "ring-amber-500/40"
        : "ring-red-500/40";
  const accentText =
    band.accent === "good"
      ? "text-emerald-300"
      : band.accent === "warn"
        ? "text-amber-300"
        : "text-red-300";
  const accentBar =
    band.accent === "good"
      ? "bg-emerald-500"
      : band.accent === "warn"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <section
      id="results"
      className="border-t border-white/5 py-20 sm:py-24 animate-fade-up"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
              Your snapshot
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              {band.headline}
            </h2>
          </div>

          <div className="mt-10 grid items-center gap-8 sm:grid-cols-[auto,1fr]">
            <div
              className={`mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-full bg-white/[0.03] ring-1 ${accentRing}`}
            >
              <AnimatedNumber target={score} />
              <span className={`mt-1 text-xs font-semibold uppercase tracking-[0.14em] ${accentText}`}>
                {band.label}
              </span>
            </div>

            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${accentBar} transition-all duration-1000 ease-out`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                <span>High blind spots</span>
                <span>Moderate</span>
                <span>Structured</span>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/65 sm:text-base">
                {band.body}
              </p>
            </div>
          </div>

          {flags.length > 0 && (
            <div className="mt-12">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                Patterns we detected
              </h3>
              <ul className="mt-5 space-y-2.5">
                {flags.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3.5"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                      aria-hidden="true"
                    />
                    <span className="text-sm leading-6 text-white/80">
                      {WEAKNESS_COPY[f]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {flags.length === 0 && (
            <div className="mt-12 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-4 text-sm text-emerald-100/85">
              No critical patterns flagged. You&apos;re running a tight operation —
              the gains from here come from sharper real-time visibility.
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-white/40">
              This snapshot isn&apos;t stored. Refreshing the page restarts it.
            </p>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/55 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              Retake assessment
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(Math.round(eased * target));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <span className="text-5xl font-semibold tabular-nums text-white">
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consequences
// ─────────────────────────────────────────────────────────────────────────────

const CONSEQUENCES = [
  {
    title: "Production delays",
    body:
      "Lines stop because someone realises mid-shift that a key part is out of stock.",
  },
  {
    title: "Material shortages",
    body:
      "Reorder points exist on paper but never get checked — until production halts.",
  },
  {
    title: "Cash locked in overstock",
    body:
      "To avoid shortages, you over-order. Working capital sits on the shelf instead of in the bank.",
  },
  {
    title: "Missed delivery windows",
    body:
      "You promised a date assuming stock was correct. It wasn't, and the customer notices.",
  },
  {
    title: "Coordination overhead",
    body:
      "Hours every week spent on WhatsApp threads asking 'how many do we have?' and 'who ordered that?'.",
  },
  {
    title: "Scaling gets harder",
    body:
      "What worked at 50 SKUs collapses at 150. Manual systems don't scale — but the order book does.",
  },
];

function Consequences() {
  return (
    <section className="border-t border-white/5 py-20 sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            What this usually leads to
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Operational blind spots don&apos;t stay invisible.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/60">
            The patterns above tend to surface as concrete problems —
            usually at the worst possible moment.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONSEQUENCES.map((c) => (
            <div
              key={c.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-white/20 hover:bg-white/[0.045]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-full bg-red-500"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Risk
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Solution (Operza)
// ─────────────────────────────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    title: "Real-time inventory",
    body:
      "One dashboard. Every raw material, current stock, last movement — visible from any phone or laptop.",
  },
  {
    title: "BOMs that update inventory",
    body:
      "Define a product once. Every production run automatically deducts the right raw materials.",
  },
  {
    title: "Low-stock alerts",
    body:
      "Reorder thresholds per part. The app warns you before the line stops, not after.",
  },
  {
    title: "Finished goods tracking",
    body:
      "Finished units logged per run, ready for dispatch. Commit to delivery windows with confidence.",
  },
  {
    title: "Full operational logs",
    body:
      "Every stock change, every production run, every adjustment — timestamped and auditable.",
  },
];

function Solution() {
  return (
    <section className="border-t border-white/5 py-20 sm:py-24">
      <div className="container-page">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
              How manufacturers fix this
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              One system for inventory, production, and finished goods.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/65">
              Operza centralises the data your factory already produces every
              day — and connects it. Raw materials, BOMs, production runs,
              finished goods, and logs. No installation, works on a phone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Open Operza
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="/#contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.05]"
              >
                Book a demo
              </a>
            </div>
          </div>

          <ul className="space-y-3 lg:col-span-7">
            {CAPABILITIES.map((c, i) => (
              <li
                key={c.title}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black text-[11px] font-semibold tabular-nums text-white/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-white/60">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="border-t border-white/5 py-20 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-6 py-14 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop guessing. Start seeing.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/65">
              Open the app, add your parts and products, log your first
              production run. Setup takes minutes, not weeks.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
              >
                Open Operza
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="/#contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08] sm:w-auto"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lite footer
// ─────────────────────────────────────────────────────────────────────────────

function FooterLite() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
        <p>© {new Date().getFullYear()} Operza. Built for manufacturers in India.</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            Open app
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowUpRight({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.5 5.5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 11-2 0V7.914l-6.793 6.793a1 1 0 01-1.414-1.414L11.086 6.5H7.5a1 1 0 01-1-1z" />
    </svg>
  );
}
