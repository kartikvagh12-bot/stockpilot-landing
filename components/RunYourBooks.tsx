import ScreenshotFrame, { type Shot } from "@/components/ScreenshotFrame";

// Books described strictly on its own terms first. A Books workspace has no
// inventory, manufacturing or fulfilment capability, so nothing here may claim
// a bill receives stock or that an invoice comes from a dispatch. Those are
// Complete behaviours and are stated separately, at the bottom, labelled.

const PAYMENTS: Shot = {
  src: "/product/payments.png",
  screen: "Payments",
  alt: "The Operza payments screen listing money received and paid, each row showing the party, the amount, the account it moved through, and whether it is fully matched or still held as an advance",
  width: 1483,
  height: 560,
  sample: true,
};

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
    title: "Money reconciled",
    body: "Match imported bank statements against your recorded entries. Set opening balances once, copied from your accountant's last balance sheet.",
  },
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
            match the supplier and record it. Sales invoices go straight into
            the books. When money moves, match it bill by bill against the
            documents it settles, or hold it as an advance.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ScreenshotFrame shot={PAYMENTS} />
          </div>

          <div className="lg:col-span-5">
            <div className="space-y-8">
              {COLUMNS.map((c) => (
                <div key={c.title} className="claim">
                  <h3 className="text-base font-semibold text-slate-900">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>

            {/* The one place on the page where the two halves are claimed to
                meet, and it names the plan that actually does it. */}
            <div className="mt-10 rounded-2xl border border-brand-200 bg-brand-50/50 p-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                In Operza Complete
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                These books connect to the factory. Dispatches record the sale,
                and supplier bills can receive their linked materials into stock
                at the same time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
