import { CARDS, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// The Operza Linspace card. The page is noindex, but a shared link still
// deserves a card that says the product is in development.
export const alt = CARDS.linspace.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgCard(CARDS.linspace);
}
