import ScreenshotFrame, { type Shot } from "@/components/ScreenshotFrame";

// Written for the person who will actually evaluate this: the accountant.
//
// The ten book surfaces are set as one typographic row rather than ten icon
// cards. Ten cards would say "we have ten features"; a list of names an
// accountant already recognises says "this is the thing you know", which is
// the actual argument.
//
// TALLY CLAIM BOUNDARY: export only, and only the three approved sentences.
// The Windows connector exists and is packaged, but no customer has installed
// it and automatic enqueue is not armed in production, so the site does not
// mention sync, direct delivery, or a future date.

const STATEMENT: Shot = {
  screen: "Balance Sheet",
  alt: "An Operza balance sheet, showing what the business owns and owes, balanced against the books",
  sample: true,
};

const TALLY: Shot = {
  screen: "Download for Tally",
  alt: "The Operza Tally screen, generating an export file of recorded invoices and bills",
  sample: true,
};

const BOOKS = [
  "Ledger",
  "Day Book",
  "Cash Book",
  "Bank Book",
  "Sales Register",
  "Journal Register",
  "Notes",
  "Trial Balance",
  "Profit & Loss",
  "Balance Sheet",
];

export default function BooksAndTally() {
  return (
    <section className="section-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.11]"
      />

      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <span className="eyebrow-invert">The books</span>
          <h2 className="mt-6 h-deep">
            Ledgers, registers and statements your accountant already knows.
          </h2>
          <p className="p-deep">
            Every entry lands in a double-entry spine. The Ledger gives opening,
            movement and closing per account, with debits and credits balanced
            at every stage. Trial Balance, Profit &amp; Loss and Balance Sheet
            come off the same entries, with no separate month-end assembly.
          </p>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-3 gap-y-3">
          {BOOKS.map((name) => (
            <li
              key={name}
              className="rounded-md border border-white/12 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-white/75"
            >
              {name}
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ScreenshotFrame shot={STATEMENT} tone="deep" />
          </div>

          <div className="lg:col-span-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">
              TallyPrime
            </span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              Your accountant keeps working in Tally.
            </h3>
            <p className="mt-5 text-sm leading-7 text-white/65 sm:text-base">
              Operza exports recorded invoices and bills as a file your
              accountant imports into TallyPrime. You can import your existing
              Tally ledger names so entries land against the accounts you
              already use. Operza tracks which entries have already been sent,
              so the same entries are not exported again.
            </p>

            <ScreenshotFrame shot={TALLY} tone="deep" className="mt-8" />

            <div className="mt-10">
              <a href="#contact" className="btn-invert">
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
