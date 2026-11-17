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

export const DESTINATIONS: readonly Destination[] = [
  {
    url: SHIFT.path as SiteRoute,
    label: SHIFT.name,
    when: "The visitor wants to understand the manufacturing and accounting product in depth.",
  },
  {
    url: "/shift#plans",
    label: "Operza Shift plans",
    when: "The visitor is choosing between Operza Factory, Operza Books and Operza Complete.",
  },
  {
    url: "/shift#faq",
    label: "Operza Shift FAQ",
    when: "A common setup or usage question the FAQ already answers.",
  },
  {
    url: DEMO_HREF as SiteRoute,
    label: "Book a demo",
    when: "The visitor wants a demo, pricing, a decision that needs a person, or anything the knowledge base cannot answer.",
  },
  {
    url: LINSPACE.path as SiteRoute,
    label: LINSPACE.name,
    when: "The visitor asks about construction, drawings, quantity takeoff, bills of quantities or estimating.",
  },
  {
    url: "/health-check",
    label: "Manufacturing Health Check",
    when: "A manufacturer wants a quick self-assessment of how visible their factory records are.",
  },
  {
    url: "/#contact",
    label: "Contact Operza",
    when: "A general question for the company, including about Operza Linspace.",
  },
];

/** Contact details the assistant may give out. Nothing else. */
export const CONTACT = {
  email: SITE.email,
  whatsapp: SITE.whatsapp,
  app: SITE.app,
} as const;
