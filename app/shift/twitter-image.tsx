import { CARDS, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// Declared explicitly rather than leaning on the OpenGraph fallback, so the
// summary_large_image card this route advertises always resolves to a file.
export const alt = CARDS.shift.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return renderOgCard(CARDS.shift);
}
