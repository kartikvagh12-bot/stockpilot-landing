"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { DEMO_HREF, SITE } from "@/lib/site";

// "Ask anything about Operza...": the homepage's conversational input.
//
// Rendered only when the server has confirmed the assistant is fully
// configured (lib/assistant/runtime/config.ts); otherwise the homepage shows
// nothing here, never a disabled or pretend box.
//
// The conversation lives in this component's state only: nothing is stored
// in the browser or sent anywhere but /api/assistant. Answers are rendered as
// text; the only links created are the site's own approved destinations, so
// a model answer can never inject markup or send a visitor off-site.

type Turn = { role: "user" | "assistant"; content: string; interrupted?: boolean };
type Problem = "rate_limited" | "unavailable" | "too_long" | "failed";

const MAX_CHARS = 600;
const MAX_HISTORY = 12;
const STREAM_ERROR_MARKER = "\u001Eerror";

// Paths the assistant is allowed to link to (lib/assistant/destinations.ts),
// longest first so "/shift#contact" wins over "/shift".
const PATHS = [
  "/shift#contact", "/shift#plans", "/shift#factory", "/shift#books", "/shift#costing",
  "/shift#complete", "/shift#faq", "/health-check", "/linspace", "/#contact", "/shift",
];
const TOKEN = new RegExp(
  `(${[SITE.app, SITE.email, ...PATHS].map((s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|")})(?![\\w/#-])`,
  "g",
);

function Linked({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const cls =
          "font-medium text-white underline decoration-brand-400/70 underline-offset-4 hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-sm";
        if (part === SITE.app)
          return (
            <a key={i} href={SITE.app} target="_blank" rel="noopener noreferrer" className={cls}>
              {part}
            </a>
          );
        if (part === SITE.email)
          return (
            <a key={i} href={`mailto:${SITE.email}`} className={cls}>
              {part}
            </a>
          );
        return (
          <Link key={i} href={part} className={cls}>
            {part}
          </Link>
        );
      })}
    </>
  );
}

/** Plain-text answer to paragraphs and simple "- " lists. No HTML is parsed. */
function Answer({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•]\s+/.test(l)))
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  <span>
                    <Linked text={l.replace(/^\s*[-•]\s+/, "")} />
                  </span>
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="whitespace-pre-line">
            <Linked text={block} />
          </p>
        );
      })}
    </div>
  );
}

const PROBLEM_TEXT: Record<Problem, string> = {
  rate_limited: "That's a lot of questions in a short time. Please wait a minute and try again.",
  unavailable: "The assistant isn't available right now.",
  too_long: "That question is too long. Please shorten it and try again.",
  failed: "Something went wrong while answering.",
};

export default function AskOperza() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const noteId = useId();

  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the newest words in view inside the conversation panel only; the
  // page itself is never scrolled.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, busy]);

  const send = useCallback(async (history: Turn[]) => {
    setProblem(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // Only text and roles go to the server, trimmed to the history limit and
    // starting with a visitor turn.
    let payload = history.map(({ role, content }) => ({ role, content }));
    if (payload.length > MAX_HISTORY) payload = payload.slice(payload.length - MAX_HISTORY);
    if (payload[0]?.role === "assistant") payload = payload.slice(1);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const code = res.status;
        setProblem(code === 429 ? "rate_limited" : code === 400 || code === 413 ? "too_long" : code === 503 ? "unavailable" : "failed");
        return;
      }
      setTurns([...history, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const shown = text.split(STREAM_ERROR_MARKER)[0];
        setTurns([...history, { role: "assistant", content: shown }]);
      }
      if (text.includes(STREAM_ERROR_MARKER)) {
        setTurns([...history, { role: "assistant", content: text.split(STREAM_ERROR_MARKER)[0], interrupted: true }]);
        setProblem("failed");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setProblem("failed");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = draft.trim().slice(0, MAX_CHARS);
    if (!q || busy) return;
    // A failed or interrupted answer is dropped from what is sent next.
    const clean = turns.filter((t) => !t.interrupted && t.content);
    const history: Turn[] = [...clean, { role: "user", content: q }];
    setTurns(history);
    setDraft("");
    void send(history);
  }

  function retry() {
    const clean = turns.filter((t) => !t.interrupted && t.content);
    const history = clean.at(-1)?.role === "assistant" ? clean.slice(0, -1) : clean;
    if (history.at(-1)?.role !== "user") return;
    setTurns(history);
    void send(history);
  }

  function stop() {
    abortRef.current?.abort();
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    setProblem(null);
    setDraft("");
    inputRef.current?.focus();
  }

  const started = turns.length > 0;

  return (
    <div className="mt-10 max-w-2xl">
      <div
        className={`rounded-2xl border bg-white/[0.035] transition-colors ${
          started ? "border-white/15" : "border-white/[0.12] focus-within:border-white/30"
        }`}
      >
        {started && (
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-busy={busy}
            aria-label="Conversation about Operza"
            className="max-h-[min(26rem,55vh)] space-y-6 overflow-y-auto px-5 pb-2 pt-5 text-[15px] leading-7 text-white/85 sm:px-6"
          >
            {turns.map((t, i) =>
              t.role === "user" ? (
                <div key={i}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">You asked</p>
                  <p className="mt-1 text-white">{t.content}</p>
                </div>
              ) : (
                <div key={i} className="border-l border-brand-500/70 pl-4">
                  {t.content ? <Answer text={t.content} /> : null}
                </div>
              ),
            )}
            {busy && turns.at(-1)?.role === "user" && (
              <p className="flex items-center gap-2 text-sm text-white/55">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60 motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60 [animation-delay:150ms] motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60 [animation-delay:300ms] motion-reduce:animate-none" />
                </span>
                Thinking
              </p>
            )}
            {problem && (
              <div role="alert" className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
                <p>{PROBLEM_TEXT[problem]}</p>
                <p className="mt-1.5 text-white/60">
                  {problem === "unavailable" || problem === "failed" ? (
                    <>
                      You can still{" "}
                      <Link href={DEMO_HREF} className="underline underline-offset-4 hover:text-white">
                        book a demo
                      </Link>{" "}
                      or write to{" "}
                      <a href={`mailto:${SITE.email}`} className="underline underline-offset-4 hover:text-white">
                        {SITE.email}
                      </a>
                      .
                    </>
                  ) : null}
                </p>
                {(problem === "failed" || problem === "rate_limited") && (
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-3 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="flex items-center gap-2 p-2 pl-4 sm:pl-5" role="search" aria-label="Ask about Operza">
          <label htmlFor={inputId} className="sr-only">
            Ask a question about Operza
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Escape" && busy) stop();
            }}
            maxLength={MAX_CHARS}
            placeholder={started ? "Ask a follow-up..." : "Ask anything about Operza..."}
            autoComplete="off"
            spellCheck
            enterKeyHint="send"
            aria-describedby={noteId}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-white placeholder:text-white/45 focus:outline-none"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex h-10 shrink-0 items-center rounded-xl border border-white/20 px-3.5 text-sm font-semibold text-white transition hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send question"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#05070f] transition hover:bg-white/90 disabled:bg-white/25 disabled:text-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f]"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </form>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-1">
        <p id={noteId} className="max-w-lg text-xs leading-5 text-white/40">
          Answers are written by AI from Operza&apos;s published product information and can be wrong.
          Please don&apos;t share personal or financial details.
        </p>
        {started && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-sm text-xs font-semibold text-white/55 underline-offset-4 transition hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            New conversation
          </button>
        )}
      </div>
    </div>
  );
}
