import type { KnowledgeEntry, SourceRef } from "@/lib/assistant/types";

// The Operza website assistant's knowledge base.
//
// One entry per statement. Product facts and limitations were checked against
// operza-app source at PRODUCT_SOURCE.commit (lib/assistant/sources.ts) and
// cite the exact text that supports them; `npm run verify:assistant-sources`
// re-reads every one of those anchors at that commit. Marketing copy cites the
// page on this site that renders it, and is positioning, not a capability.
// Policies cite the Founder decision they come from. Unknowns are questions
// the assistant must not answer itself.
//
// Never add or change a product statement without re-reading its source.

const app = (path: string, anchor: string): SourceRef => ({ repo: "operza-app", path, anchor });
const site = (path: string, anchor: string): SourceRef => ({ repo: "stockpilot-landing", path, anchor });
const decision = (path: string, anchor: string): SourceRef => ({ repo: "decision", path, anchor });

const NO_GUESSING = decision("CLAUDE.md", "no fabricated metrics, testimonials, customer logos, release dates or ROI");

export const KNOWLEDGE: readonly KnowledgeEntry[] = [
  /* ---------------------------------------------------------------- company */
  {
    id: "company-identity",
    topic: "company",
    kind: "policy",
    appliesTo: ["company"],
    statement:
      "Operza is the company and its public brand. It builds software for complex business workflows. Its products are Operza Shift, for manufacturing, which is available today, and Operza Linspace, for construction, which is in development.",
    sources: [
      decision("CLAUDE.md", "Operza is the sole public-facing parent brand."),
      site("app/layout.tsx", "Operza builds software for complex business workflows. Operza Shift runs"),
    ],
    links: ["/"],
  },
  {
    id: "company-positioning",
    topic: "company",
    kind: "marketing-copy",
    appliesTo: ["company"],
    statement:
      "Operza's approved positioning: Complex work. Clearer possibilities. We build software around the processes businesses depend on, bringing structure to information, workflows and everyday operations. Good software should help people manage complex work with greater clarity.",
    sources: [
      site("lib/og-card.tsx", 'title: "Complex work. Clearer possibilities."'),
      site("components/WhatWeBuild.tsx", "We build software around the processes businesses depend on,"),
      site("components/Approach.tsx", "We believe good software should help people manage complex work"),
    ],
    links: ["/"],
  },
  {
    id: "company-legal-name",
    topic: "company",
    kind: "policy",
    appliesTo: ["company"],
    statement:
      "For legal or invoicing questions only: Operza's registered company name is Operza Technologies Private Limited. In every other context, call the company Operza.",
    sources: [site("lib/site.ts", 'legalName: "Operza Technologies Private Limited"')],
  },
  {
    id: "company-location",
    topic: "company",
    kind: "marketing-copy",
    appliesTo: ["company"],
    statement: "Operza is based in India.",
    sources: [site("components/CompanyContact.tsx", '<Row label="Based in" value="India" />')],
  },
  {
    id: "company-facts-unknown",
    topic: "company",
    kind: "unknown",
    appliesTo: ["company"],
    statement:
      "The knowledge base has nothing on Operza's founding date, team, funding, customer count, customer names or results. Do not answer these; offer to connect the visitor with the team.",
    sources: [NO_GUESSING],
    confirmWithHuman: true,
    links: ["/#contact"],
  },

  /* --------------------------------------------------------------- products */
  {
    id: "shift-overview",
    topic: "products",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Operza Shift is a web application for manufacturers that covers the shop floor (materials, recipes, production, packing, finished goods and dispatch) and the books (sales invoices, supplier bills, payments, ledgers and financial statements). It is offered as three plans: Operza Factory, Operza Books and Operza Complete. Existing customers sign in at https://app.operza.in.",
    sources: [
      app("features/onboarding/suite-selection.tsx", 'tagline: "The whole business: the factory plus connected accounting.",'),
      app("lib/capabilities.ts", "if (inventory && manufacturing && fulfilment && accounting && integration_bridge) {"),
    ],
    links: ["/shift"],
  },
  {
    id: "shift-name",
    topic: "products",
    kind: "policy",
    appliesTo: ["shift"],
    statement:
      "Operza Shift is the website's name for the product family. Inside the app the product is simply Operza, and the plans keep their own names: Operza Factory, Operza Books and Operza Complete.",
    sources: [
      decision("CLAUDE.md", "website name for now: do not rename the live application"),
      site("components/Plans.tsx", "Inside the app, the three"),
    ],
  },
  {
    id: "shift-positioning",
    topic: "products",
    kind: "marketing-copy",
    appliesTo: ["shift"],
    statement:
      "Operza Shift's approved positioning: manufacturing software for Indian factories. Run what you make, what you move, what you sell, and the books behind it.",
    sources: [site("app/shift/page.tsx", "Manufacturing software for Indian factories. Track materials")],
    links: ["/shift"],
  },

  /* ------------------------------------------------------------------ plans */
  {
    id: "plan-factory",
    topic: "plans",
    kind: "product-fact",
    appliesTo: ["factory"],
    statement:
      "Operza Factory runs the floor: materials and finished-goods stock, products and recipes, production, packing, and dispatch to customers.",
    sources: [
      app("features/onboarding/suite-selection.tsx", 'tagline: "Run the floor: inventory, production and dispatch.",'),
      app("lib/capabilities.ts", "if (inventory && manufacturing && fulfilment && !accounting && !integration_bridge) {"),
    ],
    links: ["/shift#plans", "/shift#factory"],
  },
  {
    id: "plan-books",
    topic: "plans",
    kind: "product-fact",
    appliesTo: ["books"],
    statement:
      "Operza Books runs the books: customers and suppliers, sales invoices, supplier bills, payments and receipts, opening balances, registers and financial statements.",
    sources: [
      app("features/onboarding/suite-selection.tsx", '"No stock, production or dispatch",'),
      app("lib/capabilities.ts", "if (accounting && !inventory && !manufacturing && !fulfilment && !integration_bridge) {"),
    ],
    links: ["/shift#plans", "/shift#books"],
  },
  {
    id: "plan-complete",
    topic: "plans",
    kind: "product-fact",
    appliesTo: ["complete"],
    statement:
      "Operza Complete is everything in Operza Factory plus connected accounting: bills, invoices, payments, bank reconciliation, ledgers, registers, financial statements and export for TallyPrime.",
    sources: [
      app("features/onboarding/suite-selection.tsx", '"Bills, invoices, payments & bank reconciliation",'),
      app("lib/capabilities.ts", "if (inventory && manufacturing && fulfilment && accounting && integration_bridge) {"),
    ],
    links: ["/shift#plans", "/shift#complete"],
  },
  {
    id: "plan-choice-at-setup",
    topic: "plans",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "A business chooses one of the three plans when it sets up its workspace. Screens a plan does not include do not appear in its menu.",
    sources: [app("lib/capabilities.ts", '/** The three onboarding-selectable suite kinds. "Custom" is DERIVED only')],
    links: ["/shift#plans"],
  },

  /* -------------------------------------------------------- plan boundaries */
  {
    id: "factory-no-accounting",
    topic: "plan-boundaries",
    kind: "limitation",
    appliesTo: ["factory"],
    statement:
      "Operza Factory has no accounting or books. A dispatch in Factory records the customer and an invoice reference, but it does not create a sales invoice or any accounting entry. It suits a factory whose accountant keeps the books elsewhere.",
    sources: [
      app("features/onboarding/suite-selection.tsx", '"No accounting or books",'),
      app("features/dispatch/dispatch-form.tsx", 'const bridgeOn = useHasCapability("integration_bridge");'),
    ],
    links: ["/shift#plans"],
  },
  {
    id: "books-no-stock",
    topic: "plan-boundaries",
    kind: "limitation",
    appliesTo: ["books"],
    statement:
      "Operza Books has no stock, production or dispatch. A supplier bill in Books is recorded as a bill or expense; it cannot receive material into stock.",
    sources: [
      app("features/onboarding/suite-selection.tsx", '"No stock, production or dispatch",'),
      app("features/expenses/expense-sheet.tsx", "const canReceiveMaterial = mayReceiveMaterial && hasInventory;"),
    ],
    links: ["/shift#plans"],
  },
  {
    id: "complete-dispatch-invoice",
    topic: "plan-boundaries",
    kind: "product-fact",
    appliesTo: ["complete"],
    statement:
      "In Operza Complete, a dispatch reduces finished-goods stock and records a linked sales invoice in the books, when every line has a selling price. This connection exists only in Complete.",
    sources: [
      app("features/dispatch/dispatch-form.tsx", "Operza records a linked sales invoice when every line"),
      app("features/dispatch/dispatch-form.tsx", 'const bridgeOn = useHasCapability("integration_bridge");'),
    ],
    links: ["/shift#complete"],
  },
  {
    id: "complete-bill-receives-stock",
    topic: "plan-boundaries",
    kind: "product-fact",
    appliesTo: ["complete"],
    statement:
      "In Operza Complete, a supplier bill can receive the material it paid for into stock: link a bill line to a material and the stock arrives as the purchase is recorded. Lines not linked to a material stay as expenses.",
    sources: [
      app("features/documents/review-view.tsx", "Link an item to a material to receive stock, or leave it as expense"),
      app("features/expenses/expense-sheet.tsx", "const canReceiveMaterial = mayReceiveMaterial && hasInventory;"),
    ],
    links: ["/shift#complete"],
  },
  {
    id: "boundaries-enforced",
    topic: "plan-boundaries",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Plan boundaries are enforced by the system itself, not only hidden in the menu, so a workspace cannot record what its plan does not include.",
    sources: [app("lib/capabilities.ts", "Authoritative enforcement is the database (RLS write policies + RPC")],
  },
  {
    id: "custom-plan-not-offered",
    topic: "plans",
    kind: "limitation",
    appliesTo: ["shift"],
    statement:
      "Only the three plans are offered when a business sets up. Do not describe or offer any other or custom combination; if a visitor asks for one, they should talk to the Operza team.",
    sources: [app("lib/capabilities.ts", '/** The three onboarding-selectable suite kinds. "Custom" is DERIVED only')],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* ------------------------------------------------------ materials, stock */
  {
    id: "materials-basics",
    topic: "materials-stock",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "Each material has a stock level, an alert level and a unit of measure (pieces, boxes, packets, weights such as grams and kilograms, or volumes such as millilitres and litres). A material shows as low when it reaches its alert level.",
    sources: [
      app("features/parts/parts-view.tsx", "Every material, how much is in stock, its alert level, and how it's measured."),
      app("features/parts/add-part-sheet.tsx", "Low-stock chip triggers at or below this."),
      app("lib/units.ts", 'weight: ["mg", "g", "kg"],'),
    ],
    links: ["/shift#factory"],
  },
  {
    id: "stock-receipts",
    topic: "materials-stock",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "When material is received you enter the quantity and the rate per unit, and Operza updates both the stock and the material's average cost.",
    sources: [app("features/parts/add-stock-view.tsx", 'and the rate per unit. We update its stock and its{" "}')],
  },
  {
    id: "stock-adjustments",
    topic: "materials-stock",
    kind: "limitation",
    appliesTo: ["factory", "complete"],
    statement:
      "Stock can be corrected by a manual adjustment. Finished-goods adjustments take a reason typed by the user; material adjustments are recorded as manual adjustments without a separate typed reason.",
    sources: [
      app("features/parts/api.ts", "Apply a manual adjustment to a part's stock and/or alert level."),
      app("features/finished-goods/adjust-fg-sheet.tsx", "stock changes log a `finished_goods_logs` row with the user-supplied"),
    ],
  },

  /* ------------------------------------------------- recipes, production */
  {
    id: "recipes-components",
    topic: "bom-production",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "Each product has a recipe (bill of materials). Components made in-house, such as a moulded base or a frame, can be products in their own right and used inside the recipe of a higher-level product.",
    sources: [
      app("features/products/create-product-sheet.tsx", "This is a manufactured component"),
      app("features/products/create-product-sheet.tsx", "in-house (e.g. a moulded Base or Frame) and consume in"),
    ],
    links: ["/shift#factory"],
  },
  {
    id: "production-all-or-nothing",
    topic: "bom-production",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "A production run converts materials into finished goods. Every material is checked first: if any material is short, nothing is deducted and no units are added.",
    sources: [
      app("features/production/run-production-view.tsx", "Convert materials into finished goods. If any material is short, nothing is deducted."),
    ],
    links: ["/shift#factory"],
  },
  {
    id: "production-undo",
    topic: "corrections",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "An admin can undo a production run as long as nothing later depends on it. The original record stays in the history, marked as undone.",
    sources: [
      app("features/production-logs/confirm-undo-production-dialog.tsx", '"Cannot undo. Downstream operations exist"'),
      app("features/production-logs/confirm-undo-production-dialog.tsx", "the run as undone. History keeps the original record with an"),
    ],
  },

  /* --------------------------------------------------- packing, dispatch */
  {
    id: "packing",
    topic: "packing-dispatch",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "Packing turns finished goods into packed goods using the packaging materials set for each product. If any packaging material is short, nothing is packed.",
    sources: [
      app("features/packing/packing-view.tsx", "Pack finished goods using the packaging materials set for the product. If anything is short, nothing is packed."),
    ],
  },
  {
    id: "dispatch",
    topic: "packing-dispatch",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "A dispatch records goods leaving the factory: the customer, the invoice reference and the products. Finished-goods stock drops automatically.",
    sources: [
      app("features/dispatch/dispatch-view.tsx", "Record goods leaving the factory: customer, invoice reference, products. Finished-goods stock drops automatically."),
    ],
    links: ["/shift#factory"],
  },

  /* ---------------------------------------------------------------- costing */
  {
    id: "cost-rollup",
    topic: "costing",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "Product cost is built up from the recipe: the materials at their average cost, in-house components costed the same way, plus labour and overhead per unit. Packing labour and overhead can be set separately.",
    sources: [
      app("supabase/migrations/094_employee_access_expand.sql", "v_sub_cost := public.compute_product_cost(v_sub_row.subproduct_id);"),
      app("supabase/migrations/094_employee_access_expand.sql", "v_total     := v_material + v_product.labour_per_unit + v_product.overhead_per_unit;"),
      app("features/products/product-detail-sheet.tsx", "packing_overhead_per_pack: z.coerce"),
    ],
    links: ["/shift#costing"],
  },
  {
    id: "cost-changes",
    topic: "costing",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "The Cost changes screen lists the products that now cost more or less than when they were last made, and what changed.",
    sources: [
      app("lib/nav.ts", '"/cost-intelligence", label: "Cost changes"'),
      app("features/cost-intelligence/cost-intelligence-view.tsx", "Products that now cost more or less than when you last made them, and what changed."),
    ],
    links: ["/shift#costing"],
  },
  {
    id: "margin-at-dispatch",
    topic: "costing",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement:
      "Manufacturing cost is captured on each line at the moment of dispatch, so a dispatch shows revenue, manufacturing cost and gross margin as they stood that day. This is gross margin, not net profit.",
    sources: [
      app("features/dispatch/history-detail-sheet.tsx", "line.cost_at_dispatch_per_unit != null"),
      app("features/dispatch/margin-panel.tsx", "line into Revenue / Manufacturing Cost / Gross Margin"),
    ],
    links: ["/shift#costing"],
  },

  /* ------------------------------------------------------------- accounting */
  {
    id: "payments-matching",
    topic: "accounting",
    kind: "product-fact",
    appliesTo: ["books", "complete"],
    statement:
      "Money received from a customer or paid to a supplier is matched against their open invoices or bills, or kept as an advance.",
    sources: [
      app("features/settlements/record-settlement-sheet.tsx", "Money a customer paid you. Match it against their open invoices, or keep it as an advance."),
    ],
    links: ["/shift#books"],
  },
  {
    id: "openings",
    topic: "accounting",
    kind: "product-fact",
    appliesTo: ["books", "complete"],
    statement:
      "The books start on a chosen date, usually 1 April of the financial year. Opening balances are entered then, with unpaid invoices from before Operza entered bill by bill so each stays traceable. A new business can skip opening balances.",
    sources: [
      app("features/openings/openings-view.tsx", "The day your Operza books begin, usually April 1 of the current financial year."),
      app("features/openings/openings-view.tsx", "Unpaid invoices from before Operza. Bill-wise entries keep each invoice traceable."),
    ],
  },
  {
    id: "reports",
    topic: "accounting",
    kind: "product-fact",
    appliesTo: ["books", "complete"],
    statement:
      "The books include Ledger, Day Book, Cash Book, Bank Book, Sales Register, Journal Register, Trial Balance, Profit & Loss and Balance Sheet, plus credit and debit notes.",
    sources: [
      app("lib/nav.ts", '"/day-book", label: "Day Book"'),
      app("lib/nav.ts", '"/balance-sheet", label: "Balance Sheet"'),
      app("lib/nav.ts", "// M5 PR C (ADR-074): credit & debit notes."),
    ],
    links: ["/shift#books"],
  },
  {
    id: "closing-stock",
    topic: "accounting",
    kind: "product-fact",
    appliesTo: ["complete"],
    statement:
      "Closing stock is valued from purchase and production records. You pin the value at month and year ends, and the financial statements use exactly those pinned figures.",
    sources: [
      app("features/closing-stock/closing-stock-view.tsx", "Pin the value at month and year ends. Your financial statements use exactly these figures."),
    ],
    links: ["/shift#costing"],
  },
  {
    id: "supplier-bill-reading",
    topic: "accounting",
    kind: "product-fact",
    appliesTo: ["books", "complete"],
    statement:
      "Operza Shift includes AI-assisted supplier-bill reading: a bill uploaded as a PDF or a photo is read by an AI model for the supplier, the items and the GST, and you check and correct everything before anything is recorded. It depends on how the service is configured, so it is not guaranteed for every workspace; confirm it with the Operza team. Bills can always be entered by hand.",
    sources: [
      app("features/documents/documents-view.tsx", "Drop in a supplier bill (PDF or photo) and Operza reads the supplier,"),
      app("features/documents/documents-view.tsx", "items, and GST for you. You verify everything before anything is"),
      app("lib/documents/extract.ts", "const client = new Anthropic({ apiKey });"),
      app("app/api/documents/extract/route.ts", "Bill reading isn't configured on this deployment."),
    ],
    links: ["/shift#books", "/shift#contact"],
    confirmWithHuman: true,
  },
  {
    id: "expenses-phone",
    topic: "accounting",
    kind: "product-fact",
    appliesTo: ["books", "complete"],
    statement: "Cash expenses can be recorded from a phone; Expenses is one of the screens in the phone navigation.",
    sources: [app("lib/nav.ts", "paid and settled outright. Mobile-first — the phone rail is where a cash")],
  },
  {
    id: "no-gst-returns",
    topic: "accounting",
    kind: "limitation",
    appliesTo: ["books", "complete"],
    statement:
      "Operza does not file GST returns (such as GSTR-1 or GSTR-3B). Operza's own product plans list return filing as outside the product, with filing staying with the accountant, for example in Tally.",
    sources: [
      app("docs/GST_COMPLIANCE_V1.md", "* GST return filing (GSTR-1 / 3B)."),
      app("docs/ACCOUNTING_V1.md", "GST return filing, TDS/TCS, payroll, statutory financial statements,"),
      app("docs/FIRST_CUSTOMER_PILOT_V1.md", "* **GST return (GSTR) filing/preparation** — remains Tally's job."),
    ],
  },
  {
    id: "gst-return-prep-unknown",
    topic: "gst",
    kind: "unknown",
    appliesTo: ["books", "complete"],
    statement:
      "Whether Operza can prepare or export GST return data for the accountant (for example a GSTR-1 file) is not confirmed. Do not promise it; offer to confirm with the Operza team.",
    sources: [
      app("docs/ACCOUNTING_M5.md", "GSTR return preparation (exports remain"),
      app("docs/ACCOUNTING_V1.md", "GSTR-1 *data export*"),
    ],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* ------------------------------------------------------------------- bank */
  {
    id: "bank-statement-import",
    topic: "bank",
    kind: "product-fact",
    appliesTo: ["complete"],
    statement:
      "In Operza Complete, bank statements can be imported as CSV, Excel (.xlsx), LibreOffice (.ods) or a text PDF, and their lines are matched against what you recorded (bank reconciliation).",
    sources: [
      app("features/bank-recon/import/statement-reader.ts", 'export const BANK_STATEMENT_EXTENSIONS = [".csv", ".xlsx", ".ods", ".pdf"] as const;'),
      app("features/onboarding/suite-selection.tsx", '"Bills, invoices, payments & bank reconciliation",'),
    ],
  },
  {
    id: "bank-limits",
    topic: "bank",
    kind: "limitation",
    appliesTo: ["complete"],
    statement:
      "Scanned (image) PDF bank statements are not accepted, statements are not read by AI, and there is no live bank feed or automatic bank connection.",
    sources: [
      app("features/bank-recon/import/grid-pdf.ts", "Scanned PDF import is not available yet."),
      app("docs/PROJECT_STATE.md", "image PDF is **V1.1** and is refused safely in V1; no OCR, AI extraction,"),
    ],
  },
  {
    id: "bank-recon-in-books-unknown",
    topic: "bank",
    kind: "unknown",
    appliesTo: ["books"],
    statement:
      "Whether bank reconciliation is available in Operza Books alone (rather than only in Complete) is not confirmed. The plan descriptions list it under Complete; for Books, the visitor should confirm with the team.",
    sources: [app("features/onboarding/suite-selection.tsx", '"Bills, invoices, payments & bank reconciliation",')],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* ------------------------------------------------------------------ tally */
  {
    id: "tally-export",
    topic: "tally",
    kind: "product-fact",
    appliesTo: ["complete"],
    statement:
      "Operza exports recorded invoices and bills as an XML file that the accountant imports into TallyPrime. Existing Tally ledger names can be imported so entries land on the accounts already used, and Operza tracks which entries were already exported so they are not sent twice.",
    sources: [
      app("features/tally/tally-view.tsx", "Export recorded invoices and bills as a file your accountant imports into TallyPrime."),
      app("features/tally/import-ledgers-dialog.tsx", "<DialogTitle>Import Tally ledgers</DialogTitle>"),
      app("features/tally/tally-view.tsx", "Untick “Not yet sent only” to re-export."),
    ],
    links: ["/shift#complete"],
  },
  {
    id: "tally-export-only",
    topic: "tally",
    kind: "limitation",
    appliesTo: ["complete"],
    statement:
      "Tally is export only: the accountant downloads the file from Operza and imports it into TallyPrime. There is no automatic or live sync and no direct connection to Tally for customers today, and nothing comes back from Tally into Operza.",
    sources: [
      app("docs/PROJECT_STATE.md", "installed the connector**, so customers use manual Download-for-Tally today."),
      app("lib/tally/auto-enqueue.ts", "Automatic enqueue is OFF unless `TALLY_AUTO_ENQUEUE=true`."),
    ],
    links: ["/shift#complete"],
  },
  {
    id: "tally-refusals",
    topic: "tally",
    kind: "limitation",
    appliesTo: ["complete"],
    statement:
      "Some dispatches cannot be exported to Tally as item invoices and are refused with a reason: sales to unregistered (B2C) customers, inter-state (IGST) sales, zero-rated or exempt sales, Composition-scheme cases, and invoices with incomplete GST details.",
    sources: [
      app("lib/tally/mapping.ts", "is an unregistered / B2C inventory dispatch"),
      app("lib/tally/mapping.ts", "is an inter-state (IGST) inventory dispatch"),
      app("lib/tally/mapping.ts", "ambiguous/Composition/unknown-type/gst_incomplete/bad-rate/bad-HSN"),
    ],
    confirmWithHuman: true,
  },
  {
    id: "tally-plan",
    topic: "tally",
    kind: "limitation",
    appliesTo: ["factory"],
    statement: "Tally export is part of Operza Complete. Operza Factory has no accounting, so it has nothing to export to Tally.",
    sources: [app("features/onboarding/suite-selection.tsx", '"No accounting or books",')],
  },

  /* -------------------------------------------------------------------- gst */
  {
    id: "gst-recorded",
    topic: "gst",
    kind: "product-fact",
    appliesTo: ["books", "complete"],
    statement:
      "Operza stores the business's GSTIN and records GST on invoices and bills, applying the CGST and SGST split or IGST by comparing the business's state with the customer's or supplier's state.",
    sources: [
      app("lib/gst.ts", "migration 040's CGST/SGST-vs-IGST split compares business state vs"),
      app("features/settings/settings-view.tsx", '.max(15, "GSTIN must be at most 15 characters")'),
    ],
  },
  {
    id: "no-einvoice-eway",
    topic: "gst",
    kind: "limitation",
    appliesTo: ["shift"],
    statement:
      "Operza does not generate e-Invoices (IRN) or e-Way Bills, and it does not submit anything to the GST portal. Do not describe these as available or coming.",
    sources: [
      app("docs/PROJECT_STATE.md", "**GST Compliance:** no e-Invoice / e-Way Bill generation exists yet (§4.1)."),
      app("lib/capabilities.ts", "never part of a suite preset or suite label, and enabling it enables no"),
    ],
  },
  {
    id: "gst-advice",
    topic: "gst",
    kind: "policy",
    appliesTo: ["shift"],
    statement:
      "Do not give GST, tax or legal advice (rates, applicability, filing obligations). Describe only what Operza records, and suggest the visitor confirm tax questions with their accountant.",
    sources: [decision("CLAUDE.md", "Publish no pricing, trial or")],
  },

  /* ----------------------------------------------------------- users, access */
  {
    id: "roles",
    topic: "users-access",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Each user has a role: admin, operator, viewer or accountant. Employee Access offers six ready-made presets: Administrator, Storekeeper, Production, Dispatch, Accounts and Read-only.",
    sources: [
      app("lib/auth/role.ts", 'export type Role = "admin" | "operator" | "viewer" | "accountant";'),
      app("lib/access-presets.ts", 'label: "Administrator: full access",'),
      app("lib/access-presets.ts", 'label: "Read-only: all areas",'),
    ],
  },
  {
    id: "worker-login",
    topic: "users-access",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Floor staff do not need email addresses: each worker signs in with the workspace code and a username. An admin can reset a worker's password or disable the account.",
    sources: [
      app("features/settings/settings-view.tsx", "Each worker logs in with the workspace code + username, no email required."),
      app("features/team/reset-password-dialog.tsx", "Reset password for a worker (admin operation)."),
      app("features/team/confirm-status-dialog.tsx", "Confirm enable/disable. Disable kicks the worker out of their"),
    ],
  },
  {
    id: "preset-detail-unknown",
    topic: "users-access",
    kind: "unknown",
    appliesTo: ["shift"],
    statement:
      "The exact screens and actions each access preset allows are not in the knowledge base. Describe the presets by name only and offer a demo for detail.",
    sources: [app("lib/access-presets.ts", 'label: "Read-only: all areas",')],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* ---------------------------------------------------------- setup, import */
  {
    id: "csv-import",
    topic: "setup-import",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Existing data such as materials, products, recipes, packaging, customers and suppliers can be imported from a CSV, Excel (.xlsx) or LibreOffice (.ods) file that matches the template, up to 10,000 rows per file.",
    sources: [
      app("features/imports/import-csv-sheet.tsx", "Upload a CSV, Excel (.xlsx), or LibreOffice (.ods) file that matches the template."),
      app("features/imports/import-csv-sheet.tsx", ".csv (5 MB) · .xlsx · .ods (10 MB) · 10,000 rows max"),
    ],
  },
  {
    id: "factory-workbook",
    topic: "setup-import",
    kind: "product-fact",
    appliesTo: ["factory", "complete"],
    statement: "A whole factory's starting data can also be loaded from the Factory Workbook, an Excel (.xlsx) file of up to 6,000 data rows.",
    sources: [
      app("features/factory-import/contract.ts", "export const MAX_TOTAL_DATA_ROWS = 6_000;"),
      app("features/factory-import/factory-import-sheet.tsx", 'const ACCEPT = ".xlsx";'),
    ],
  },
  {
    id: "sample-data",
    topic: "setup-import",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "At setup a workspace can load sample data to explore the whole flow first. Operza Factory offers samples for furniture, garments, packaging, food, chemicals and electrical plastics; Operza Complete uses the electrical plastics sample; Operza Books has its own accounting sample. A workspace can also start empty.",
    sources: [
      app("features/onboarding/sample-data.ts", 'furniture: "Furniture manufacturer",'),
      app("features/onboarding/sample-data.ts", 'export const COMPLETE_SAMPLE_INDUSTRY = "electrical_plastics" as const;'),
      app("features/onboarding/configure-workspace.tsx", 'if (suite === "books") return <ConfigureBooksWorkspace />;'),
    ],
  },
  {
    id: "migration-help-unknown",
    topic: "setup-import",
    kind: "unknown",
    appliesTo: ["shift"],
    statement:
      "Whether Operza's team helps move a business's existing records in, how long setup takes, and what training is offered are not in the knowledge base. Offer a demo to discuss.",
    sources: [NO_GUESSING],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* ---------------------------------------------------------------- devices */
  {
    id: "browser-phone",
    topic: "devices",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Operza runs in a web browser on a laptop or a phone, with the same login and the same data; nothing needs installing. The phone navigation covers Dashboard, Inventory, Production, Finished goods, Packing, Dispatch and Expenses.",
    sources: [
      app("lib/nav.ts", '"/dispatch", label: "Dispatch", icon: Send, group: "primary", mobile: true },'),
      app("lib/nav.ts", '"/expenses", label: "Expenses", icon: Wallet, group: "money", mobile: true },'),
    ],
  },
  {
    id: "offline-unknown",
    topic: "devices",
    kind: "unknown",
    appliesTo: ["shift"],
    statement:
      "Offline use, a native mobile app, and how well screens outside the phone navigation work on a phone are not in the knowledge base. Do not claim them.",
    sources: [app("lib/nav.ts", '"/expenses", label: "Expenses", icon: Wallet, group: "money", mobile: true },')],
    confirmWithHuman: true,
  },

  /* ------------------------------------------------------------ corrections */
  {
    id: "corrections-kept",
    topic: "corrections",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Records are not quietly rewritten. An undone dispatch, an undone production run or a reversed note stays visible in the history alongside what replaced it.",
    sources: [
      app("features/dispatch/confirm-undo-dispatch-dialog.tsx", "the original record stays in /dispatch-history forever."),
      app("features/notes/reverse-note-dialog.tsx", "same cost, and the original stays visible as cancelled."),
    ],
  },

  /* ----------------------------------------------------------- plan changes */
  {
    id: "turn-on-accounting",
    topic: "plan-changes",
    kind: "product-fact",
    appliesTo: ["factory"],
    statement:
      "An admin on Operza Factory can turn accounting on from Settings without losing data. Any other change of plan goes through a workspace reset, so it should be discussed with the Operza team.",
    sources: [
      app("features/settings/settings-view.tsx", "An admin can turn accounting on"),
      app("features/settings/settings-view.tsx", "workspace reset, where setup reopens and the current plan can be"),
    ],
    confirmWithHuman: true,
  },
  {
    id: "no-downgrade",
    topic: "plan-changes",
    kind: "limitation",
    appliesTo: ["shift"],
    statement:
      "Once a workspace holds data, turning accounting, dispatch or production off is refused, so a workspace cannot simply move to a smaller plan. Do not promise plan changes.",
    sources: [
      app("supabase/migrations/121_gst_permissions_and_capability.sql", "raise exception 'Accounting can''t be turned off — this workspace has % (contact support). Its data is kept.',"),
      app("supabase/migrations/121_gst_permissions_and_capability.sql", "Dispatch & fulfilment can''t be turned off — this workspace has dispatch history"),
      app("supabase/migrations/121_gst_permissions_and_capability.sql", "Manufacturing can''t be turned off — this workspace has production, packing, or recipe data"),
    ],
  },

  /* --------------------------------------------------------------- linspace */
  {
    id: "linspace-status",
    topic: "linspace",
    kind: "policy",
    appliesTo: ["linspace"],
    statement:
      "Operza Linspace is in development and not available to use. There is no release date, pricing, beta, waiting list or sign-up.",
    sources: [
      site("lib/site.ts", 'status: "in-development"'),
      site("components/LinspaceStatus.tsx", "is in development. It is not available to use"),
    ],
    links: ["/linspace"],
  },
  {
    id: "linspace-direction",
    topic: "linspace",
    kind: "marketing-copy",
    appliesTo: ["linspace"],
    statement:
      "Operza Linspace is the product Operza is developing for construction. It is being designed around construction drawings, quantity takeoff, bills of quantities and cost estimation. That is its direction, not a description of anything it does today.",
    sources: [site("components/LinspaceHero.tsx", "It is being designed around construction drawings,")],
    links: ["/linspace"],
  },
  {
    id: "linspace-policy",
    topic: "linspace",
    kind: "policy",
    appliesTo: ["linspace"],
    statement:
      "For Operza Linspace, never give a date, timeline, price, feature list or availability, and never offer to put someone on a list. A visitor who wants to talk about construction work can contact Operza.",
    sources: [decision("CLAUDE.md", "It may be introduced only as in development")],
    links: ["/linspace", "/#contact"],
  },

  /* ---------------------------------------------------------------- contact */
  {
    id: "demo-route",
    topic: "contact",
    kind: "policy",
    appliesTo: ["shift"],
    statement:
      "For a demo of Operza Shift, the visitor fills in the demo form at /shift#contact and the team gets in touch. You cannot book it for them.",
    sources: [site("lib/site.ts", 'DEMO_HREF = "/shift#contact"')],
    links: ["/shift#contact"],
  },
  {
    id: "contact-details",
    topic: "contact",
    kind: "policy",
    appliesTo: ["company"],
    statement:
      "For anything else, visitors can email founder@operza.in or message Operza on WhatsApp at +91 87338 65541. Existing customers sign in to the app at https://app.operza.in.",
    sources: [site("lib/site.ts", 'email: "founder@operza.in"')],
    links: ["/#contact"],
  },

  /* ---------------------------------------------------------------- pricing */
  {
    id: "pricing-not-published",
    topic: "pricing",
    kind: "policy",
    appliesTo: ["shift", "linspace"],
    statement:
      "Pricing is not published and is discussed during a demo. Do not state, estimate or compare prices, discounts, free plans, free trials or billing terms.",
    sources: [
      site("lib/faq.ts", 'answer: "Pricing is discussed during the demo."'),
      decision("CLAUDE.md", "Publish no pricing, trial or"),
    ],
    links: ["/shift#contact"],
    confirmWithHuman: true,
  },
  {
    id: "pricing-unknown",
    topic: "pricing",
    kind: "unknown",
    appliesTo: ["shift"],
    statement:
      "Plan prices, whether prices differ by plan or by number of users, payment terms and any free period are unknown to the assistant. The Operza team answers these in a demo.",
    sources: [decision("CLAUDE.md", "Publish no pricing, trial or")],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* -------------------------------------------------------------- languages */
  {
    id: "app-english",
    topic: "languages",
    kind: "limitation",
    appliesTo: ["shift"],
    statement:
      "The Operza Shift application is in English. It is not available in Hindi, Gujarati or other languages, even though this assistant can answer questions in Hindi and Gujarati.",
    sources: [app("app/layout.tsx", 'lang="en"')],
  },

  /* --------------------------------------------------------------- security */
  {
    id: "workspace-isolation",
    topic: "security",
    kind: "product-fact",
    appliesTo: ["shift"],
    statement:
      "Each business has its own workspace, kept separate from every other business's data, and roles control what each user can see and do; both are enforced by the system itself, not only by the screens.",
    sources: [
      app("supabase/migrations/061_business_capabilities.sql", "using (business_id = public.current_business_id())"),
      app("lib/capabilities.ts", "Authoritative enforcement is the database (RLS write policies + RPC"),
    ],
  },
  {
    id: "security-unknown",
    topic: "security",
    kind: "unknown",
    appliesTo: ["shift"],
    statement:
      "Certifications, data-hosting location, backup schedules, uptime guarantees and contract terms are not in the knowledge base. Do not claim any; offer to connect the visitor with the team.",
    sources: [NO_GUESSING],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },
  {
    id: "integrations-unknown",
    topic: "security",
    kind: "unknown",
    appliesTo: ["shift"],
    statement:
      "Apart from the TallyPrime export and the file imports described above, the knowledge base lists no integrations (for example other accounting software, e-commerce, payment or bank connections). Do not claim any.",
    sources: [app("docs/PROJECT_STATE.md", "installed the connector**, so customers use manual Download-for-Tally today.")],
    confirmWithHuman: true,
    links: ["/shift#contact"],
  },

  /* ----------------------------------------------------------- health check */
  {
    id: "health-check",
    topic: "health-check",
    kind: "marketing-copy",
    appliesTo: ["shift"],
    statement:
      "The Manufacturing Health Check at /health-check is eight questions about how visible a factory's materials, production and finished-goods records are. It takes about a minute, needs no email, and gives an instant self-assessment, not an industry benchmark.",
    sources: [
      site("components/HealthCheckCallout.tsx", "Eight questions about materials, production and finished goods."),
      site("app/health-check/HealthCheck.tsx", "simple self-assessment based on your answers"),
    ],
    links: ["/health-check"],
  },
];

/** Limitations a visitor must always be told when they ask about the area.
 *  The offline test fails if any of these entries disappears. */
export const REQUIRED_LIMITATIONS = [
  "factory-no-accounting",
  "books-no-stock",
  "tally-export-only",
  "tally-refusals",
  "no-einvoice-eway",
  "no-gst-returns",
  "bank-limits",
  "no-downgrade",
  "linspace-status",
  "app-english",
  "custom-plan-not-offered",
] as const;
