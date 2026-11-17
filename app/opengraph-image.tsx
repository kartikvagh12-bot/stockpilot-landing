import { CARDS, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

// The company card, shared by the homepage.
export const alt = CARDS.company.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgCard(CARDS.company);
}
