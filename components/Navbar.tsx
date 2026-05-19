"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/site";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/85 backdrop-blur"
          : "border-b border-transparent bg-white/0"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Operza home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <LogoMark />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            Operza
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <a href="#contact" className="btn-ghost text-sm">
            Book demo
          </a>
          <a
            href={SITE.app}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Open app
            <ArrowUpRight />
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 md:hidden"
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

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="btn-secondary !py-2 !px-3 text-sm"
              >
                Book demo
              </a>
              <a
                href={SITE.app}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="btn-primary !py-2 !px-3 text-sm"
              >
                Open app
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function LogoMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M6.5 5.5a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 11-2 0V7.914l-6.793 6.793a1 1 0 01-1.414-1.414L11.086 6.5H7.5a1 1 0 01-1-1z" />
    </svg>
  );
}
