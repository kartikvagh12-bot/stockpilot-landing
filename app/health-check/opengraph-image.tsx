import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// The route declares a large-image card, so it needs an image of its own.
// A nested segment that defines its own openGraph block does not pick up the
// root segment's image file, which is how /health-check ended up advertising
// a card with nothing to render.
//
// It renders the SHARED generic Operza card, not a Health Check design, so the
// alt describes that card rather than the route that links to it.
export const alt =
  "Operza manufacturing software: Run the factory and the books in one system.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function HealthCheckOpengraphImage() {
  return renderOgCard();
}
