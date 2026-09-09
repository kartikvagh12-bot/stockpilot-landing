export const SITE = {
  name: "Operza",
  domain: "https://www.operza.in",
  // Primary app: Next.js on Vercel at app.operza.in.
  app: "https://app.operza.in",
  email: "founder@operza.in",
  whatsapp: "+91 87338 65541",
  whatsappLink: "https://wa.me/918733865541",
} as const;

// Every entry points at a section that exists on the homepage. Contact is not
// a text link because "Book a demo" is the only filled button in the navbar,
// and Health Check is reached from the page and the footer rather than
// competing for a nav slot.
export const NAV_LINKS = [
  { href: "/#factory", label: "Factory" },
  { href: "/#books", label: "Books" },
  { href: "/#costing", label: "Costing" },
  { href: "/#faq", label: "FAQ" },
] as const;
