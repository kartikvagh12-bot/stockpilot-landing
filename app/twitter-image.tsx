import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// Declared explicitly rather than leaning on the OpenGraph fallback, so the
// summary_large_image card the site advertises always resolves to a real file.
export const alt =
  "Operza: run your factory and your books in one system";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return renderOgCard();
}
