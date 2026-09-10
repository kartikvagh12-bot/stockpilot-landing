// Books, described on its own terms. A Books workspace has no stock,
// production or dispatch, so nothing here moves inventory. The connection to
// the floor is a Complete claim and lives in its own section.
//
// The accounting surfaces are named as a plain row rather than a grid of
// cards: an accountant recognises the list, and a grid would only make it
// longer.

const COLUMNS = [
  {
    title: "Money in",
    body: "Sales invoices, the sales register with taxable value and GST, and what is still outstanding per customer.",
  },
  {
    title: "Money out",
    body: "Supplier bills with GST and what is still to pay, cash expenses recorded from a phone, and what you still owe each supplier.",
  },
  {
    title: "Money settled",
    body: "Receipts and payments matched bill by bill, or held as an advance. Imported bank statements matched against what you recorded.",
  },
];

const SURFACES = [
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

export default function RunYourBooks() {
  return (
    <section
      id="books"
      className="section scroll-mt-16 border-t border-slate-200/70 bg-slate-50/60"
    >
      <div className="container-wide">
        <div className="max-w-2xl">
          <span className="eyebrow">Operza Books</span>
          <h2 className="h-section">Know what you are owed and what you owe.</h2>
          <p className="p-section">
            Upload a supplier bill and Operza reads it. You check the numbers,
            match the supplier and record it. When money moves, match it against
            the documents it settles, or hold it as an advance until you know.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {COLUMNS.map((c) => (
            <div key={c.title} className="claim">
              <h3 className="text-base font-semibold text-slate-900">
                {c.title}
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            The books your accountant already knows
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SURFACES.map((s) => (
              <li
                key={s}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
            Opening, movement and closing per account, with debits and credits
            balanced at every stage. Opening balances are set once, copied from
            your accountant&apos;s last balance sheet.
          </p>
        </div>
      </div>
    </section>
  );
}
