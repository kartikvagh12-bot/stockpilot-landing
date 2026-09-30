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
