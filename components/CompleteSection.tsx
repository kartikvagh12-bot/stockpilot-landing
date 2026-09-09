// The differentiation section. It states exactly the three things Complete
// does and stops there.
//
// TALLY BOUNDARY: export only, in the approved wording. The Windows connector
// exists but no customer runs it and automatic enqueue is not armed, so the
// site says nothing about sync, direct delivery or a future date.

const CONNECTIONS = [
  {
    n: "01",
    title: "A dispatch reduces stock and records the sale",
    body: "The units leave finished-goods stock and the sales invoice lands in the books from the same action, so what the customer owes is right without a second entry.",
  },
  {
    n: "02",
    title: "A supplier bill can receive the material it paid for",
    body: "Record the bill, enter the received quantity, and the material arrives in stock as the purchase is posted.",
  },
  {
    n: "03",
    title: "The floor and the books share one workspace",
    body: "Factory activity and accounting sit in the same business record, so month end is not an exercise in reconciling two separate files.",
  },
];

export default function CompleteSection() {
  return (
    <section id="complete" className="section-deep scroll-mt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-invert mask-fade-edges opacity-[0.11]"
      />

      <div className="container-wide py-24 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <span className="eyebrow-invert">Operza Complete</span>
          <h2 className="mt-6 h-deep">
            The floor and the books stop being separate records.
          </h2>
          <p className="p-deep">
            Factory and Books each work on their own. Complete is what happens
            when one action is allowed to move both.
          </p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {CONNECTIONS.map((c) => (
            <div key={c.n} className="claim-invert">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                {c.n}
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">
            TallyPrime
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Operza exports recorded invoices and bills as a file your accountant
            imports into TallyPrime. You can import your existing Tally ledger
            names so entries land against the accounts you already use, and
            Operza tracks which entries have already been sent.
          </p>
        </div>
      </div>
    </section>
  );
}
