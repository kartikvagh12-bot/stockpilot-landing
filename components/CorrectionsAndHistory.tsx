import ScreenshotFrame, { type Shot } from "@/components/ScreenshotFrame";

// Answers the objection nobody says out loud: what happens when my team gets
// it wrong, and can I trust this as a business record.
//
// Two claim boundaries hold here. The correction promise is scoped to recorded
// stock and production movements, because ordinary master records are editable
// like anywhere else. And the separation claim stops at workspaces and roles:
// no absolutes about who can see what, and no mention of the mechanism.

const HISTORY: Shot = {
  screen: "Inventory history, with a correction",
  alt: "Operza inventory history showing a correcting entry linked to the earlier entry it compensates",
};

export default function CorrectionsAndHistory() {
  return (
    <section className="section border-t border-slate-200/70">
      <div className="container-wide">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ScreenshotFrame shot={HISTORY} />
          </div>

          <div className="lg:col-span-5">
            <span className="eyebrow">Operational record</span>
            <h2 className="h-section">Mistakes get corrected, not erased.</h2>
            <p className="p-section">
              When a recorded stock or production movement needs correcting,
              Operza keeps the original and records the correction against it,
              so both stay visible and linked. A production run can be undone
              while nothing later depends on it, and Operza tells you when
              something does.
            </p>

            <div className="mt-12 space-y-8">
              <div className="claim">
                <h3 className="text-base font-semibold text-slate-900">
                  Every movement is on the record.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Inventory, production, finished goods, packing and dispatch
                  each keep their own history, with what moved and why.
                </p>
              </div>
              <div className="claim">
                <h3 className="text-base font-semibold text-slate-900">
                  Your team, with the access you set.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add workers as admin, operator or viewer. They sign in with
                  your workspace code and a username, so nobody on the floor
                  needs an email address.
                </p>
              </div>
            </div>

            <p className="mt-10 text-sm leading-6 text-slate-500">
              Each business has its own workspace, and roles control what each
              user can see and do.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
