// Where the assistant's knowledge comes from.
//
// Product truth lives in kartikvagh12-bot/operza-app. This repository does
// not become a second authority: every product-fact and limitation in the
// knowledge base cites a file in operza-app at ONE pinned commit, with a
// verbatim anchor, and `npm run verify:assistant-sources` re-checks every
// anchor against a local checkout of that commit. When operza-app moves,
// re-verify, then move the pin; never edit a statement without its source.

export const PRODUCT_SOURCE = {
  repo: "kartikvagh12-bot/operza-app",
  commit: "b676a075b5dcfa6ad46d19e19df5440277220920",
  /** The date the statements below were checked against that commit. */
  verifiedOn: "2026-11-17",
  /** operza-app's own current-status document. */
  projectState: "docs/PROJECT_STATE.md",
} as const;

/** Founder decisions recorded in this repository, used as the source for
 *  policy entries (they are not product capabilities). */
export const DECISIONS = {
  multiProduct: "CLAUDE.md#approved-direction-founder-2026-11-17",
  pricing: "CLAUDE.md#product-truth-operza-shift",
  linspace: "CLAUDE.md#founder-decisions-made",
} as const;
