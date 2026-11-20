import { DEMO_HREF, LINSPACE, SHIFT, SITE } from "@/lib/site";
import type { SiteRoute } from "@/lib/assistant/types";

// The places the assistant may send a visitor. Every path is read from
// lib/site.ts or names a section the site renders, and the offline test
// checks that each one resolves (a page exists, and an anchor's section id
// exists on that page). The assistant links only to these and to the
// contact details below; it never invents a URL.

export type Destination = {
  url: SiteRoute;
  label: string;
  /** When the assistant should offer this link. */
  when: string;
};

// Ordered most specific first. The section anchors on /shift exist so an
// answer can send a visitor to the part of the page that covers the topic,
// rather than to the top of a long page; the browser links exactly this list
// (components/AskOperza.tsx PATHS, checked by the offline tests).
export const DESTINATIONS: readonly Destination[] = [
  {
    url: "/shift#plans",
    label: "Operza Shift plans",
    when: "The visitor is choosing a plan, or comparing Operza Factory, Operza Books and Operza Complete.",
  },
  {
    url: "/shift#factory",
    label: "Operza Shift: running the factory",
    when: "Stock, materials, recipes and bills of materials, production, packing or dispatch on the floor.",
  },
  {
    url: "/shift#books",
    label: "Operza Shift: running the books",
    when: "Accounting on its own: invoices, supplier bills, payments, ledgers, registers or financial statements.",
  },
  {
    url: "/shift#costing",
    label: "Operza Shift: costs and margin",
    when: "Product cost, average cost, cost changes or sales margin.",
  },
  {
    url: "/shift#complete",
    label: "Operza Complete",
    when: "What Operza Complete connects (a dispatch recorded as a sale, a supplier bill received into stock) or the export to TallyPrime.",
  },
  {
    url: "/shift#faq",
    label: "Operza Shift FAQ",
    when: "A common setup or usage question the FAQ already answers.",
  },
  {
    url: SHIFT.path as SiteRoute,
    label: SHIFT.name,
    when: "A general overview of the manufacturing and accounting product, when no section above fits better.",
  },
  {
    url: DEMO_HREF as SiteRoute,
    label: "Book a demo",
    when: "Pricing, a demo, or a product question that needs the Operza team to confirm (an integration, compliance, data migration, a specific setup).",
  },
  {
    url: LINSPACE.path as SiteRoute,
    label: LINSPACE.name,
    when: "Any question about Operza Linspace or construction: drawings, quantity takeoff, bills of quantities or estimating.",
  },
  {
    url: "/health-check",
    label: "Manufacturing Health Check",
    when: "A manufacturer wants a quick self-assessment of how visible their factory records are.",
  },
  {
    url: "/#contact",
    label: "Contact Operza",
    when: "A question about the company itself (who runs it, where it is, its registered name, customers), or a visitor who wants to talk about Operza Linspace.",
  },
];

/** Contact details the assistant may give out. Nothing else. */
export const CONTACT = {
  email: SITE.email,
  whatsapp: SITE.whatsapp,
  app: SITE.app,
} as const;
