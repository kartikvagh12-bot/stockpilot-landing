"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/lib/site";

// ─────────────────────────────────────────────────────────────────────────────
// Assessment data
// ─────────────────────────────────────────────────────────────────────────────
// SCORING IS FROZEN. Question ids, their order, and each option's score and
// flag BY POSITION are unchanged from the original assessment. We have no
// evidence base for recalibrating them, so only the wording moved: the prompts
// and labels now use the vocabulary the product actually ships (materials,
// finished goods, BOM or recipe, alert level).
//
// Each option carries a 0-3 score and an optional `flag` naming one specific
// gap. Max possible across 8 questions = 24, normalized to 0-100.
//
// SCOPE: this stays a factory-operations check. It asks how visible and how
// well recorded materials, production and finished goods are. It deliberately
// asks nothing about invoices, bills or books; the homepage explains Factory,
// Books and Complete, and widening this tool would blur that.

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
    prompt: "How do you currently track material and finished-goods stock?",
    options: [
      { label: "Spreadsheets", score: 1.5, flag: "spreadsheet_risk" },
      { label: "WhatsApp or verbal updates", score: 0.5, flag: "manual_dependency" },
      { label: "Notebook or paper register", score: 0.5, flag: "manual_dependency" },
      { label: "ERP or dedicated software", score: 3 },
      { label: "No structured system", score: 0, flag: "no_system" },
    ],
  },
  {
    id: "shortages",
    prompt: "How often do material shortages catch the team by surprise?",
    options: [
      { label: "Frequently", score: 0, flag: "shortages_frequent" },
      { label: "Sometimes", score: 1, flag: "shortages_occasional" },
      { label: "Rarely", score: 2 },
      { label: "Never", score: 3 },
    ],
  },
  {
    id: "stock_check",
    prompt:
      "Can you check current stock without asking someone or doing a fresh count?",
    options: [
      { label: "Yes, from anywhere", score: 3 },
      { label: "Only by asking staff", score: 1, flag: "visibility_lag" },
      { label: "Sometimes, depending who is around", score: 1.5, flag: "visibility_lag" },
      { label: "No", score: 0, flag: "no_visibility" },
    ],
  },
  {
    id: "bom",
    prompt: "Do you record what each product consumes through a BOM or recipe?",
    options: [
      { label: "Yes, formal BOMs or recipes for every product", score: 3 },
      { label: "For some products only", score: 2, flag: "partial_bom" },
      { label: "On paper or from memory", score: 1, flag: "manual_bom" },
      { label: "No", score: 0, flag: "no_bom" },
    ],
  },
  {
    id: "key_person",
    prompt:
      "If the person who normally handles inventory is absent, can the team still find what it needs?",
    options: [
      { label: "Yes, everything is in a shared system", score: 3 },
      { label: "Mostly, with some delay", score: 2, flag: "key_person_risk" },
      { label: "Not easily, information is hard to locate", score: 1, flag: "key_person_risk" },
      { label: "No, work stalls until they are back", score: 0, flag: "key_person_critical" },
    ],
  },
  {
    id: "finished_goods",
    prompt: "How do you track finished goods?",
    options: [
      { label: "Dedicated software", score: 3 },
      { label: "Spreadsheet", score: 1.5, flag: "spreadsheet_risk" },
      { label: "Manual counting", score: 1, flag: "manual_dependency" },
      { label: "Not tracked consistently", score: 0, flag: "no_finished_tracking" },
    ],
  },
  {
    id: "alerts",
    prompt: "Does your system flag materials that reach their alert level?",
    options: [
      { label: "Yes", score: 3 },
      { label: "No", score: 0, flag: "no_alerts" },
    ],
  },
  {
    id: "visibility_confidence",
    prompt:
      "How confident are you that your current stock and production records match reality?",
    options: [
      { label: "Very confident", score: 3 },
      { label: "Fairly confident", score: 2 },
      { label: "Not very confident", score: 1, flag: "low_confidence" },
      { label: "We mostly estimate", score: 0, flag: "estimating" },
    ],
  },
];

const MAX_SCORE = QUESTIONS.length * 3;

// One line per flag, stating what the answer indicates. Factual and compact:
// no financial consequence, no claim about what other factories do, and no
// implication that Operza predicts anything.
const WEAKNESS_COPY: Record<WeaknessFlag, string> = {
  spreadsheet_risk:
    "Stock records depend on spreadsheets, so keeping one current version requires manual discipline.",
  manual_dependency:
    "Stock records are kept by hand, so looking something up means finding the right note or the right person.",
  no_system: "There is no shared system for checking current stock.",
  shortages_frequent:
    "Material shortages are usually discovered after they have started affecting planned work.",
  shortages_occasional:
    "Material shortages still surface during a run rather than before it.",
  visibility_lag:
    "Current stock depends on asking staff rather than checking a shared record.",
  no_visibility:
    "There is no way to confirm current stock without counting it again.",
  partial_bom:
    "Only some products have a BOM or recipe, so consumption cannot be explained for the rest.",
  manual_bom:
    "Production consumption is not consistently recorded against a BOM or recipe.",
  no_bom:
    "Finished units are produced without a recorded BOM or recipe behind them.",
  key_person_risk:
    "Important operational information depends on one person being available.",
  key_person_critical:
    "Work stops when one person is away, because the operational record is not shared.",
  no_finished_tracking: "Finished-goods stock is not recorded consistently.",
  no_alerts: "Low stock depends on someone noticing it manually.",
  low_confidence:
    "The team does not fully trust the current operational record.",
  estimating:
    "Day to day decisions are made on estimates rather than a recorded figure.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────
// Thresholds and normalization are unchanged. Only the labels and prose moved.

type Band = {
  label: string;
  accent: "good" | "warn" | "alert";
  headline: string;
  body: string;
};

function bandFor(score: number): Band {
  if (score >= 85) {
    return {
      label: "Operationally structured",
      accent: "good",
      headline: "Your core factory records are in good shape.",
      body:
        "Your answers suggest stock and production information is usually available without relying on manual checks. The remaining opportunity is to reduce the few manual handoffs that are still left.",
    };
  }
  if (score >= 60) {
    return {
      label: "Some operational blind spots",
      accent: "warn",
      headline:
        "The basics are in place, but some records still depend on manual checks.",
      body:
        "Your operation has structure, but a few gaps can make stock or production information slower to verify than it should be.",
    };
  }
  return {
    label: "High reliance on manual records",
    accent: "alert",
    headline: "Important factory information is difficult to verify quickly.",
    body:
      "Your answers suggest that stock or production information often depends on people, paper or separate files rather than one shared operational record.",
  };
}

function computeScore(answers: (number | null)[]) {
  let sum = 0;
  const flags = new Set<WeaknessFlag>();
  QUESTIONS.forEach((q, i) => {
    const idx = answers[i];
    if (idx == null) return;
    const opt = q.options[idx];
    if (!opt) return; // guard against a stale index after data edits
    sum += opt.score;
    if (opt.flag) flags.add(opt.flag);
  });
  const raw = MAX_SCORE > 0 ? (sum / MAX_SCORE) * 100 : 0;
  const normalized = Math.max(0, Math.min(100, Math.round(raw)));
  return { normalized, flags: Array.from(flags) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Motion
// ─────────────────────────────────────────────────────────────────────────────
// The page drives two things from JS that CSS cannot reach: smooth scrolling
// between steps, and the count-up on the score. Both honour the OS setting.

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToRef(el: HTMLElement | null) {
  el?.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
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
    setTimeout(() => scrollToRef(assessmentRef.current), 40);
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
    setTimeout(() => scrollToRef(assessmentRef.current), 40);
  }

  // Scroll results into view once revealed.
  useEffect(() => {
    if (completed) {
      const id = window.setTimeout(() => scrollToRef(resultsRef.current), 200);
      return () => window.clearTimeout(id);
    }
  }, [completed]);

  return (
    <div className="health-check min-h-screen bg-[#05070f] text-white antialiased">
      <Header />

      <main>
        <Hero onStart={start} />
        <WhatItChecks />
        {!completed && (
          <section
            id="assessment"
            ref={assessmentRef}
            className="relative scroll-mt-20 border-t border-white/[0.06] py-20 sm:py-24"
          >
            <Assessment
              step={step}
              answers={answers}
              onStart={start}
              onAnswer={answer}
              onBack={back}
            />
          </section>
        )}

        {completed && (
          <div ref={resultsRef} className="scroll-mt-20">
            <Results
              score={normalized}
              band={band}
              flags={flags}
              onRestart={restart}
            />
            <WhereOperzaFits />
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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070f]/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Operza home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/operza-logo.png"
              alt=""
              width={26}
              height={26}
              className="h-[26px] w-[26px]"
              aria-hidden="true"
            />
          </span>
          <span className="text-base font-semibold tracking-tight">Operza</span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-white/60 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:inline-flex"
          >
            Sign in
          </a>
          <Link
            href="/#contact"
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#05070f] transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f]"
          >
            Book a demo
          </Link>
        </div>
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.13]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18%] -z-10 h-[420px] w-[860px] -translate-x-1/2 rounded-full bg-brand-600/12 blur-3xl"
      />

      <div className="container-page pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow-invert">
            Manufacturing Health Check · 8 questions
          </span>
          <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.028em] sm:text-5xl lg:text-[3.5rem]">
            How visible is your{" "}
            <span className="text-white/50">factory operation?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            A quick check of how your team tracks materials, production and
            finished goods. No signup. Get an instant operational snapshot and
            see where records still depend on manual checks or one person.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" onClick={onStart} className="btn-invert w-full sm:w-auto">
              Start assessment
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#what-it-checks" className="btn-invert-ghost w-full sm:w-auto">
              What it checks
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/45">
            <li className="inline-flex items-center gap-2">
              <Dot /> No email required
            </li>
            <li className="inline-flex items-center gap-2">
              <Dot /> Instant result
            </li>
            <li className="inline-flex items-center gap-2">
              <Dot /> About a minute
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
// What it checks
// ─────────────────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  {
    n: "01",
    title: "Can you see what is in stock?",
    body: "Whether current material and finished-goods stock can be checked without asking around or doing a fresh manual count.",
  },
  {
    n: "02",
    title: "Does production update the record?",
    body: "Whether BOMs or recipes and production runs are recorded consistently enough to explain what was consumed and what was produced.",
  },
  {
    n: "03",
    title: "Can the operation run without one person?",
    body: "Whether information is shared in a system or depends on a particular employee, notebook or spreadsheet.",
  },
];

function WhatItChecks() {
  return (
    <section
      id="what-it-checks"
      className="scroll-mt-16 border-t border-white/[0.06] py-16 sm:py-20"
    >
      <div className="container-page">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-8">
          {DIMENSIONS.map((d) => (
            <div key={d.n}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                {d.n}
              </div>
              <h2 className="mt-3 text-base font-semibold text-white">
                {d.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
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
          <span className="eyebrow-invert">Step 01</span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mt-4 text-base text-white/60">
            Eight questions about how your factory tracks materials, production
            and finished goods.
          </p>
          <button type="button" onClick={onStart} className="btn-invert mt-8">
            Begin
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Belt-and-suspenders: the parent unmounts this component once step
  // reaches QUESTIONS.length, but if a render slips through during a
  // state transition we render nothing rather than crash on `q.prompt`.
  if (step >= QUESTIONS.length) return null;

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
            className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
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
                    className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                      isSelected
                        ? "border-brand-400/60 bg-brand-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/85 hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "border-brand-400 bg-brand-500"
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
                          ? "translate-x-0.5 opacity-100 text-brand-300"
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
              className={`inline-flex items-center gap-1.5 rounded-md text-xs font-semibold uppercase tracking-[0.12em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                step === 0
                  ? "cursor-not-allowed text-white/20"
                  : "text-white/55 hover:text-white"
              }`}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <div className="text-xs text-white/35">
              {selected != null ? "Recorded, moving on…" : "Pick the closest match"}
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
// Emerald, amber and red appear ONLY here, carrying the band. They are not the
// page's default accent, which is brand blue.

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
      className="border-t border-white/[0.06] py-20 sm:py-24 animate-fade-up"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="eyebrow-invert">Your snapshot</span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              {band.headline}
            </h2>
          </div>

          <div className="mt-10 grid items-center gap-8 sm:grid-cols-[auto,1fr]">
            <div
              className={`mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-full bg-white/[0.03] ring-1 ${accentRing}`}
            >
              <AnimatedNumber target={score} />
              <span
                className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${accentText}`}
              >
                {band.label}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Operational visibility score
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${accentBar} transition-all duration-1000 ease-out`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                <span>Manual</span>
                <span>Mixed</span>
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
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
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
            <div className="mt-12 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-4 text-sm leading-6 text-emerald-100/85">
              No major operational gaps were flagged by these answers. The next
              gains are in keeping the remaining manual steps consistent.
            </div>
          )}

          <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm leading-6 text-white/55">
            This is a simple self-assessment based on your answers, not an
            industry benchmark.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-white/40">
              This snapshot isn&apos;t stored. Refreshing the page restarts it.
            </p>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold uppercase tracking-[0.12em] text-white/55 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
  // Clamp + sanitize so a stray NaN/Infinity never reaches the DOM as text.
  const safeTarget = Number.isFinite(target)
    ? Math.max(0, Math.min(100, Math.round(target)))
    : 0;
  // Reduced motion starts at the final value, so the count-up never runs.
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(safeTarget);
      return;
    }
    let raf = 0;
    const startTime =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const dur = 900;
    const tick = (t: number) => {
      const k = Math.min(1, (t - startTime) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(Math.round(eased * safeTarget));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safeTarget]);

  return (
    <span className="text-5xl font-semibold tabular-nums text-white">
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Where Operza fits
// ─────────────────────────────────────────────────────────────────────────────

const CAPABILITIES = [
  {
    title: "Materials and alert levels",
    body: "Current stock, receipts, adjustments and history.",
  },
  {
    title: "Products, BOMs and production",
    body: "Record what each product consumes, and check material availability before a run.",
  },
  {
    title: "Packing, finished goods and dispatch",
    body: "Record what is packed and what leaves the factory.",
  },
  {
    title: "Costing and capacity",
    body: "See current manufacturing cost and which material is limiting production.",
  },
  {
    title: "History and corrections",
    body: "Recorded movements stay visible, and supported corrections keep the original history rather than silently rewriting it.",
  },
];

function WhereOperzaFits() {
  return (
    <section className="border-t border-white/[0.06] py-20 sm:py-24">
      <div className="container-page">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <span className="eyebrow-invert">Where Operza fits</span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              One shared record for the shop floor.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/65">
              Operza Factory gives the shop floor one shared operational record
              for materials, products, production, packing, finished goods and
              dispatch.
            </p>

            <div className="mt-8 rounded-2xl border border-brand-400/25 bg-brand-500/[0.07] p-5">
              <p className="text-sm leading-6 text-white/75">
                Need the books too? Operza Complete connects the factory with
                invoices, bills, payments, ledgers and statements.
              </p>
            </div>
          </div>

          <ul className="space-y-3 lg:col-span-7">
            {CAPABILITIES.map((c, i) => (
              <li
                key={c.title}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#05070f] text-[11px] font-semibold tabular-nums text-white/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{c.title}</h3>
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
    <section className="border-t border-white/[0.06] py-20 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] px-6 py-14 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              See how Operza would fit your factory.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/65">
              Tell us what you make and where the process currently depends on
              manual records. We&apos;ll tailor the demo around the parts of
              Operza that matter to you.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/#contact" className="btn-invert w-full sm:w-auto">
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="btn-invert-ghost w-full sm:w-auto">
                Back to Operza
              </Link>
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
    <footer className="border-t border-white/[0.06] py-10">
      <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
        <p>© {new Date().getFullYear()} Operza. Built for manufacturers in India.</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/#contact" className="transition hover:text-white">
            Book a demo
          </Link>
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            Sign in
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
