/**
 * One source of truth for the FAQ.
 *
 * The visible accordion and the FAQPage structured data both read this array,
 * so the two can never drift. Structured data that disagrees with the page is
 * worse than no structured data at all.
 *
 * Answers are plain strings rather than markup, because Google expects the
 * answer text and duplicating it as JSX would reintroduce exactly the drift
 * this file exists to prevent.
 */

export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Who is Operza for?",
    answer:
      "Small and growing manufacturers in India who currently run on Excel, paper registers and WhatsApp. We have set up starting data for furniture, garments, packaging, food, chemicals and electrical plastics, but the model fits any factory that turns materials into products.",
  },
  {
    question: "What is the difference between Factory, Books and Complete?",
    answer:
      "Factory covers the shop floor: materials, products and BOMs, production, packing, finished goods and dispatch. Books covers the money: sales invoices, supplier bills, payments, opening balances, ledgers and statements. Complete is both, connected, so a dispatch records the sale in your books and a supplier bill can receive its materials into stock. You choose one when you set up your workspace.",
  },
  {
    question: "What does setting up involve?",
    answer:
      "You choose what your workspace does, then Operza loads sample data for an industry close to yours so you can see the whole flow before committing anything. You can bring your own materials, products and customers in from a CSV, Excel or LibreOffice file. If you are using Books, you also set your books start date and enter opening balances copied from your accountant's last balance sheet. A new business can skip that part.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "Operza runs in your browser, on a laptop in the office or a phone on the floor, with the same login and the same data. Dashboard, inventory, production, finished goods, packing, dispatch and expenses are all built for the phone.",
  },
  {
    question: "Can my floor staff use it without email addresses?",
    answer:
      "Yes. You add workers as admin, operator or viewer, and they sign in with your workspace code and a username. You can reset a password or disable an account yourself.",
  },
  {
    question: "My accountant works in Tally. Does that still work?",
    answer:
      "Yes. Operza exports recorded invoices and bills as a file your accountant imports into TallyPrime. You can import your existing Tally ledger names so entries land against the accounts you already use, and Operza tracks which entries have already been sent, so the same entries are not exported again.",
  },
  {
    question: "What happens when someone makes a mistake?",
    answer:
      "Operza keeps the original and records the correction against it, so both stay visible and linked. A production run can be undone while nothing later depends on it, and Operza tells you when something does.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Each business has its own workspace, and roles control what each user can see and do.",
  },
  {
    question: "How much does it cost?",
    answer: "Pricing is discussed during the demo.",
  },
] as const;

/** The FAQPage node emitted alongside the visible list. */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
