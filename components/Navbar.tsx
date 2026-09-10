"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/site";

// The previous navbar was transparent at scroll position zero, so on the light
// hero it read as text floating over the page with no ground. The hero is deep
// now, and the bar carries its own dark ground from the first pixel, turning
// opaque with a rule once the page moves under it.

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on Escape, so keyboard users are not trapped.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled || open
          ? "border-b border-white/10 bg-[#05070f]/90 backdrop-blur"
          : "border-b border-white/[0.06] bg-[#05070f]"
      }`}
    >
      <nav
        aria-label="Main"
        className="container-wide flex h-16 items-center justify-between gap-6"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Operza home"
        >
          <LogoMark />
          <span className="text-base font-semibold tracking-tight text-white">
            Operza
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/65 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {/* Open App is a real website function for existing customers, so it
              is an outlined button rather than a quiet text link. */}
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Open App
          </a>
          <a
            href="/#contact"
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#05070f] transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f]"
          >
            Book a demo
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="inline-flex items-center justify-center rounded-md p-2 text-white/80 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-white/10 bg-[#05070f] md:hidden"
      >
        <div className="container-wide flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-3.5 text-sm font-semibold text-white"
          >
            Open App
          </a>
          <a
            href="/#contact"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-4 py-3.5 text-sm font-semibold text-[#05070f]"
          >
            Book a demo
          </a>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  // The mark is near-black with a red segment, so on the dark bar it needs a
  // light plate behind it to stay legible.
  return (
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
  );
}
