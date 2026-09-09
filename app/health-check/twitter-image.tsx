import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// The route declares a large-image card, so it needs an image of its own.
// A nested segment that defines its own openGraph block does not pick up the
// root segment's image file, which is how /health-check ended up advertising
// a card with nothing to render.
export const alt = "Operza: run your factory and your books in one system";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function HealthCheckTwitterImage() {
  return renderOgCard();
}
