"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_HREF, NAV_LINKS, PRODUCTS, SITE, STATUS_LABEL } from "@/lib/site";

// One navbar for every page: Operza, the Products menu, Company, the Health
// Check, then Open App and Book a demo. It carries its own dark ground from
// the first pixel and turns translucent with a rule once the page moves under
// it.
//
// The Products menu is a disclosure, not a hover menu: a real button that
// opens on click or tap, opens and moves into the list on ArrowDown, closes on
// Escape (returning focus to the button), on a click outside, and when focus
// leaves it. The products come from PRODUCTS in lib/site.ts, so the menu and
// the registry cannot disagree.

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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

  // A route change closes the mobile sheet.
  useEffect(() => setOpen(false), [pathname]);

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
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-2.5 rounded-md ${focusRing}`}
            aria-label="Operza home"
          >
            <LogoMark />
            <span className="text-base font-semibold tracking-tight text-white">
              Operza
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <ProductsMenu pathname={pathname} />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium text-white/65 transition hover:text-white ${focusRing}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {/* Open App is a real website function for existing customers, so it
              is an outlined button rather than a quiet text link. */}
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.06] ${focusRing}`}
          >
            Open App
          </a>
          <Link
            href={DEMO_HREF}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#05070f] transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f]"
          >
            Book a demo
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className={`inline-flex items-center justify-center rounded-md p-2 text-white/80 transition hover:text-white md:hidden ${focusRing}`}
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
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-[#05070f] md:hidden"
      >
        <div className="container-wide flex flex-col gap-1 py-4">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Products
          </p>
          {PRODUCTS.map((p) => (
            <Link
              key={p.id}
              href={p.path}
              onClick={() => setOpen(false)}
              aria-current={pathname === p.path ? "page" : undefined}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-3 transition hover:bg-white/[0.06]"
            >
              <span>
                <span className="block text-base font-semibold text-white">{p.name}</span>
                <span className="mt-0.5 block text-sm text-white/55">{p.industry}</span>
              </span>
              {p.status === "in-development" && <DevBadge />}
            </Link>
          ))}

          <div className="my-2 h-px bg-white/10" aria-hidden="true" />

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
          <Link
            href={DEMO_HREF}
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-4 py-3.5 text-sm font-semibold text-[#05070f]"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProductsMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const panelId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Outside click or tap, and Escape from anywhere while open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => setOpen(false), [pathname]);

  function focusItem(i: number) {
    const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    if (!items.length) return;
    items[(i + items.length) % items.length].focus();
  }

  function onButtonKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      // The list renders on the next frame.
      requestAnimationFrame(() => focusItem(0));
    }
  }

  function onListKey(e: React.KeyboardEvent) {
    const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    const at = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(at + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(at - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(items.length - 1);
    }
  }

  const current = PRODUCTS.some((p) => p.path === pathname);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node)) close(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKey}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition hover:text-white ${focusRing} ${
          open || current ? "text-white" : "text-white/65"
        }`}
      >
        Products
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-50 mt-2 w-[23rem] rounded-xl border border-white/10 bg-[#0b0e16] p-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)]"
      >
        <ul onKeyDown={onListKey} className="flex flex-col gap-1">
          {PRODUCTS.map((p, i) => (
            <li key={p.id}>
              <Link
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={p.path}
                onClick={() => setOpen(false)}
                aria-current={pathname === p.path ? "page" : undefined}
                className={`group flex items-start justify-between gap-4 rounded-lg px-3.5 py-3 transition hover:bg-white/[0.05] focus:bg-white/[0.05] ${focusRing}`}
              >
                <span>
                  <span className="block text-sm font-semibold text-white">{p.name}</span>
                  <span className="mt-0.5 block text-[13px] text-white/55">
                    {p.industry}
                    {p.status === "available" ? ` · ${STATUS_LABEL[p.status]}` : ""}
                  </span>
                </span>
                {p.status === "in-development" ? (
                  <DevBadge />
                ) : (
                  <span aria-hidden="true" className="mt-1 text-white/30 transition group-hover:text-white/70">
                    →
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DevBadge() {
  return (
    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500" />
      {STATUS_LABEL["in-development"]}
    </span>
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
