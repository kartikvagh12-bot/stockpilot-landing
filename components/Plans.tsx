// Factory / Books / Complete.
//
// Names, taglines and bullets are the product's own, taken from the onboarding
// screen in operza-app (features/onboarding/suite-selection.tsx) so the website
// and the first screen a customer sees agree word for word.
//
// These are NOT pricing cards, and the styling is chosen to keep them from
// reading as pricing: no price slot, no billing period, no "most popular"
// badge, no upgrade language, no tick-matrix. Complete gets a brand rule and a
// faint tint because it is the shape most prospects will want, not because it
// costs more.

type Plan = {
  name: string;
  tagline: string;
  includes: string[];
  audience: string;
  emphasis?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Operza Factory",
    tagline: "Run the floor: inventory, production and dispatch.",
    includes: [
      "Materials and finished-goods stock",
      "Products, BOMs, production and packing",
      "Sell and dispatch to customers",
      "No accounting or books",
    ],
    audience:
      "For a factory that already has an accountant handling the books and wants the floor under control.",
  },
  {
    name: "Operza Books",
    tagline: "Run the books: invoices, bills, payments and statements.",
    includes: [
      "Customers, suppliers and their ledgers",
      "Sales invoices, supplier bills and payments",
      "Opening balances, registers and statements",
      "No stock, production or dispatch",
    ],
    audience:
      "For a business that wants its money in order without tracking a shop floor.",
  },
  {
    name: "Operza Complete",
    tagline: "The whole business: the factory plus connected accounting.",
    includes: [
      "Everything in Operza Factory",
      "Bills, invoices, payments and bank reconciliation",
      "Ledgers, registers and financial statements",
      "Export for TallyPrime",
    ],
    audience:
      "For a manufacturer who wants one record of what was made, what was sold, and what it was worth.",
    emphasis: true,
  },
];

export default function Plans() {
  return (
    <section id="plans" className="section scroll-mt-16">
      <div className="container-wide">
        <div className="max-w-2xl">
          <span className="eyebrow">How Operza is set up</span>
          <h2 className="h-section">Three ways to run Operza.</h2>
          <p className="p-section">
            You choose what your workspace does when you set it up. Screens you
            do not need never appear in the menu.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-7 transition ${
                plan.emphasis
                  ? "border-brand-300 bg-brand-50/40 shadow-soft"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1 w-10 rounded-full ${
                  plan.emphasis ? "bg-brand-600" : "bg-slate-300"
                }`}
              />
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                {plan.tagline}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm leading-6 text-slate-600">
                {plan.includes.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <Bullet excluded={line.startsWith("No ")} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-7 text-sm leading-6 text-slate-500">
                {plan.audience}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-600">
          Not sure which one fits?{" "}
          <a
            href="#contact"
            className="font-semibold text-slate-900 underline underline-offset-4 hover:text-brand-700"
          >
            Book a demo
          </a>{" "}
          and we will work it out with you.
        </p>
      </div>
    </section>
  );
}

/** A plan's fourth line states what it deliberately leaves out. Marking that
 *  visually keeps a scanner from reading an exclusion as an inclusion. */
function Bullet({ excluded }: { excluded: boolean }) {
  return excluded ? (
    <svg
      className="mt-1.5 h-3 w-3 flex-none text-slate-400"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M2.5 6h7" strokeLinecap="round" />
    </svg>
  ) : (
    <svg
      className="mt-1 h-4 w-4 flex-none text-brand-600"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
