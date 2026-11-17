import { CARDS, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// The Health Check is an Operza Shift tool, so it shares the Operza Shift card.
// A nested segment with its own openGraph block does not inherit the root
// segment's image file, which is why this route carries its own.
export const alt = CARDS.shift.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgCard(CARDS.shift);
}
