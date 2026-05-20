"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Sessionstorage key — dismissal persists for the browser-tab session
// but resets on a new tab, so a returning visitor still gets one nudge.
const DISMISS_KEY = "operza:floating-audit:dismissed";

// Hero is ~700px tall on desktop, ~580px on mobile. Showing the chip past
// 520px ensures it slides in just after the hero leaves the viewport,
// not while the primary CTAs are still on screen.
const SCROLL_TRIGGER_PX = 520;

export default function FloatingAudit() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Hide on /health-check itself — pointless to CTA visitors toward the
  // page they're already on.
  const isHealthCheck = pathname?.startsWith("/health-check") ?? false;

  // Initial dismissal state — read once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage can throw in private modes; safe to ignore.
    }
  }, []);

  // Scroll listener — only mounts when the chip is eligible to show, so
  // it doesn't run on /health-check or after a dismissal.
  useEffect(() => {
    if (isHealthCheck || dismissed) return;
    const onScroll = () => {
      setShow(window.scrollY > SCROLL_TRIGGER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHealthCheck, dismissed]);

  if (isHealthCheck || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignored
    }
  }

  return (
    <div
      aria-hidden={!show}
      className={`pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-all duration-500 ease-out sm:bottom-6 sm:right-6 sm:left-auto sm:justify-end sm:px-0 ${
        show
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/90 py-1 pl-1 pr-1 text-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.45)] backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <Link
          href="/health-check"
          className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/[0.06]"
        >
          <span
            className="relative inline-flex h-2 w-2 items-center justify-center"
            aria-hidden="true"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="whitespace-nowrap">60-second factory audit</span>
          <ArrowUpRight className="h-3 w-3 text-white/60 transition group-hover:text-white" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.06] hover:text-white"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ArrowUpRight({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 5.5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 11-2 0V7.914l-6.793 6.793a1 1 0 01-1.414-1.414L11.086 6.5H7.5a1 1 0 01-1-1z" />
    </svg>
  );
}
