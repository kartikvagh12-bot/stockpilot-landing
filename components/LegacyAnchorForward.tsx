"use client";

import { useEffect } from "react";

// Before the multi-product cutover the homepage was the manufacturing page,
// and links to its sections were shared as /#factory, /#books and so on. A
// fragment never reaches the server, so a redirect cannot see it: this reads
// the fragment once on load and forwards the visitor to the same section on
// the Operza Shift page.
//
// #contact is deliberately not forwarded: the company homepage has its own
// contact section, which offers the demo booking as its first action.
export const LEGACY_SHIFT_ANCHORS = [
  "product",
  "plans",
  "factory",
  "costing",
  "books",
  "complete",
  "faq",
] as const;

export default function LegacyAnchorForward() {
  useEffect(() => {
    // On load, and when the fragment changes without a reload (an old link
    // followed from this same page).
    const forward = () => {
      const id = window.location.hash.slice(1);
      if ((LEGACY_SHIFT_ANCHORS as readonly string[]).includes(id)) {
        window.location.replace(`/shift#${id}`);
      }
    };
    forward();
    window.addEventListener("hashchange", forward);
    return () => window.removeEventListener("hashchange", forward);
  }, []);
  return null;
}
