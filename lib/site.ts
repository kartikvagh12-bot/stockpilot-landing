export const SITE = {
  name: "Operza",
  domain: "https://www.operza.in",
  // Primary app — Next.js on Vercel, app.operza.in (Phase 5.5 cutover).
  // The legacy Streamlit deploy at operza.streamlit.app is kept alive
  // as a temporary fallback during the soft sunset window (30–60 days).
  app: "https://app.operza.in",
  appLegacy: "https://operza.streamlit.app",
  email: "founder@operza.in",
  whatsapp: "+91 87338 65541",
  whatsappLink: "https://wa.me/918733865541",
} as const;

export const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#screenshots", label: "Product" },
  { href: "/health-check", label: "Health check" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
] as const;
