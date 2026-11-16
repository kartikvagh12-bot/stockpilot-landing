export const SITE = {
  name: "Operza",
  // The company behind the product. Operza is the software; this is who
  // operates it. Used in the footer and the Organization structured data.
  legalName: "Operza Technologies Private Limited",
  domain: "https://www.operza.in",
  // Primary app: Next.js on Vercel at app.operza.in.
  app: "https://app.operza.in",
  email: "founder@operza.in",
  whatsapp: "+91 87338 65541",
  whatsappLink: "https://wa.me/918733865541",
} as const;

// Every entry points at something that exists: three homepage sections and the
// Health Check route. Contact is not a text link because "Book a demo" is the
// filled button, and Open App sits beside it.
export const NAV_LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/#factory", label: "Factory" },
  { href: "/#books", label: "Books" },
  { href: "/health-check", label: "Health Check" },
] as const;

// The Operza products, as this website names them. Operza is the parent brand;
// each product is listed once here so names, paths and status cannot drift
// between pages.
//
// Marketing identity only. What a product actually does is defined by its own
// source, never here: Operza Shift's plans (Operza Factory, Operza Books,
// Operza Complete) and their boundaries live in operza-app, so this registry
// deliberately carries no plans, features or capabilities.
//
// `path` is where the product's page is planned to live. `pageLive` records
// whether that page exists yet. Nothing may link to a path whose page is not
// live: the foundation guard (section J) fails if the registry claims a page
// that does not exist, or if anything links to one that is not live.
export type ProductStatus = "available" | "in-development";

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly path: `/${string}`;
  readonly pageLive: boolean;
  readonly status: ProductStatus;
};

export const PRODUCTS = [
  {
    // The existing manufacturing and business software at SITE.app. A
    // website-level family name: the application and its plans keep their
    // own names.
    id: "shift",
    name: "Operza Shift",
    path: "/shift",
    pageLive: false,
    status: "available",
  },
  {
    // Planned construction product. Not launched: no dates, pricing or
    // availability may be implied anywhere on the site.
    id: "linspace",
    name: "Operza Linspace",
    path: "/linspace",
    pageLive: false,
    status: "in-development",
  },
] as const satisfies readonly Product[];

export type ProductId = (typeof PRODUCTS)[number]["id"];
