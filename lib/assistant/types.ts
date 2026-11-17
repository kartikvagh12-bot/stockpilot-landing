// Types for the Operza website assistant's knowledge base and evaluations.
//
// Nothing here is rendered on the site and nothing here calls a model. The
// knowledge base is data the future assistant will be grounded on; the
// evaluation cases are data its answers will be graded against. Both are
// plain TypeScript so the offline tests can import them directly.

/** Who or what a statement is about. */
export type Audience =
  | "company"
  | "shift"
  | "factory"
  | "books"
  | "complete"
  | "linspace";

/**
 * What KIND of statement an entry is. The distinction is the point:
 *
 * - product-fact: a capability verified in operza-app source at the pinned
 *   commit. Cited to code (or PROJECT_STATE.md) with a verbatim anchor.
 * - limitation: something the product does NOT do, or does only partly,
 *   verified the same way. The assistant must state these plainly.
 * - marketing-copy: Founder-approved website wording, cited to the page
 *   that renders it. Positioning, not a capability claim.
 * - policy: how the assistant must behave (pricing, contact, refusals).
 *   Cited to the instruction or decision it comes from.
 * - unknown: a question the knowledge base deliberately does not answer.
 *   The assistant must say so and route the visitor to a person.
 */
export type EntryKind =
  | "product-fact"
  | "limitation"
  | "marketing-copy"
  | "policy"
  | "unknown";

export type Topic =
  | "company"
  | "products"
  | "plans"
  | "plan-boundaries"
  | "materials-stock"
  | "bom-production"
  | "packing-dispatch"
  | "costing"
  | "accounting"
  | "bank"
  | "tally"
  | "gst"
  | "users-access"
  | "setup-import"
  | "devices"
  | "corrections"
  | "plan-changes"
  | "linspace"
  | "contact"
  | "pricing"
  | "languages"
  | "security"
  | "health-check";

/**
 * A pointer to the text that supports a statement. `anchor` is an EXACT
 * substring of the file at the pinned commit (for operza-app) or at HEAD
 * (for this repository). It is how a reviewer, or a script, proves the
 * citation: if the anchor is not in the file, the citation is wrong.
 */
export type SourceRef = {
  repo: "operza-app" | "stockpilot-landing" | "decision";
  path: string;
  anchor: string;
};

/** A real page or section on operza.in the assistant may link to. */
export type SiteRoute =
  | "/"
  | "/shift"
  | "/shift#plans"
  | "/shift#factory"
  | "/shift#books"
  | "/shift#costing"
  | "/shift#complete"
  | "/shift#faq"
  | "/shift#contact"
  | "/linspace"
  | "/health-check"
  | "/#contact";

export type KnowledgeEntry = {
  id: string;
  topic: Topic;
  kind: EntryKind;
  appliesTo: Audience[];
  /** What the assistant may say, in plain customer language. */
  statement: string;
  sources: SourceRef[];
  links?: SiteRoute[];
  /** True when the visitor should confirm the point with a person. */
  confirmWithHuman?: boolean;
};

/** A regular expression stored as source + flags, with a sentence that
 *  matches it, so the test suite can prove the pattern does what it says. */
export type Pattern = { re: string; flags?: string; example: string };

export type Turn = { role: "user" | "assistant"; content: string };

export type EvalCategory =
  | "company"
  | "product-overview"
  | "plan-discovery"
  | "plan-comparison"
  | "plan-restrictions"
  | "operations"
  | "accounting"
  | "costing"
  | "tally"
  | "gst"
  | "linspace"
  | "pricing"
  | "languages"
  | "prompt-injection"
  | "data-access"
  | "unsupported"
  | "contact"
  | "unknowns";

export type EvalCase = {
  id: string;
  category: EvalCategory;
  /** The conversation so far. The last turn is the visitor's message. */
  turns: Turn[];
  expect: {
    /** The answer's substance, for a human or model judge. */
    facts: string[];
    /** Distinctions the answer must keep (for example Factory vs Complete). */
    distinctions?: string[];
    /** Each inner list is a set of alternatives; the answer must match at
     *  least one pattern from every inner list. */
    mustInclude?: Pattern[][];
    /** Claims the answer must never make. */
    mustNotInclude: Pattern[];
    /** The answer must ask the visitor a follow-up question. */
    clarify?: boolean;
    /** The answer must link to at least one of these. */
    links?: SiteRoute[];
    /** The script the answer must be written in. */
    language?: "en" | "hi" | "gu";
  };
  /** Knowledge-base entries the answer should draw on. */
  knowledge: string[];
  /** A short answer that meets every expectation. Proves the case is
   *  satisfiable and gives a live-model judge a calibration point. */
  reference: string;
};
