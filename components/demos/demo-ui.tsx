"use client";

import { useEffect, useRef, useState } from "react";

// Shared parts for the homepage's interactive examples.
//
// These are WEBSITE interfaces, not the product. They borrow Operza's visual
// language (near-black ground, one red accent, tabular numbers, quiet rules)
// and show cause and effect in a few seconds. They deliberately do not imitate
// a full screen: no sidebar, no browser chrome, no complete tables.
//
// Everything is local React state. No fetch, no persistence, nothing shared
// with the product. Every value shown is invented for the website and each
// panel says so.

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Counts a number toward its target over ~360ms. Reduced motion jumps straight
 * to the value, and so does the first render, so nothing animates on load.
 */
export function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(target);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      setValue(target);
      return;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const from = value;
    const delta = target - from;
    if (delta === 0) return;
    const dur = 360;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(from + delta * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    // A guaranteed landing. requestAnimationFrame does not fire in a
    // backgrounded or throttled tab, and without this the number would keep
    // showing the old value after the click that changed it. The animation is
    // decoration; arriving at the right number is not.
    const settle = setTimeout(() => setValue(target), dur + 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
    // `value` is intentionally not a dependency: re-running mid-tween would
    // restart the animation on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

export const inr = (n: number) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

/** The frame every interactive example sits in. */
export function DemoPanel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
          Interactive example
        </span>
      </div>
      <div className="p-5">{children}</div>
      {footer && (
        <div className="border-t border-white/10 px-5 py-3.5">{footer}</div>
      )}
    </div>
  );
}

/** One measured line: what it is, and what it is now. */
export function StatRow({
  label,
  value,
  unit,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "default" | "good" | "accent" | "muted";
}) {
  const valueTone =
    tone === "good"
      ? "text-emerald-300"
      : tone === "accent"
        ? "text-brand-300"
        : tone === "muted"
          ? "text-white/45"
          : "text-white";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-white/70">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-white/40">{hint}</p>}
      </div>
      <p className={`shrink-0 text-right text-lg font-semibold tabular-nums ${valueTone}`}>
        {value}
        {unit && (
          <span className="ml-1 text-xs font-medium text-white/40">{unit}</span>
        )}
      </p>
    </div>
  );
}

export type Activity = { id: number; text: string; tone?: "default" | "good" | "accent" };

/**
 * Newest-first list of what just happened. Announced politely, so a screen
 * reader hears the result of a click without having to hunt for it.
 */
export function ActivityFeed({
  items,
  empty = "Use the controls above to see what changes.",
}: {
  items: Activity[];
  empty?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Activity
      </p>
      <ul aria-live="polite" className="mt-2.5 space-y-1.5">
        {items.length === 0 && (
          <li className="text-xs leading-5 text-white/35">{empty}</li>
        )}
        {items.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-2.5 text-xs leading-5 text-white/70 animate-fade-up"
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                a.tone === "good"
                  ? "bg-emerald-400"
                  : a.tone === "accent"
                    ? "bg-brand-500"
                    : "bg-white/30"
              }`}
            />
            {a.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DemoButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f] disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === "accent"
          ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
          : "border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/[0.09]"
      }`}
    >
      {children}
    </button>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold uppercase tracking-[0.12em] text-white/45 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      Reset
    </button>
  );
}

/** Small helper for the append-only activity lists. */
export function useActivity() {
  const [items, setItems] = useState<Activity[]>([]);
  const next = useRef(0);
  const push = (text: string, tone?: Activity["tone"]) =>
    setItems((prev) => [{ id: next.current++, text, tone }, ...prev].slice(0, 5));
  const clear = () => setItems([]);
  return { items, push, clear };
}
