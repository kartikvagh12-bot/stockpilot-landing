// A plan diagram of Operza Shift, drawn to the real plan boundaries
// (operza-app lib/capabilities.ts): Operza Factory covers the floor, Operza
// Books covers the books, and only Operza Complete joins them. The joining
// line is the one red element, so the diagram cannot be read as saying that
// every plan connects the floor to the books.
//
// Built from HTML rather than SVG so the labels stay real, readable text at
// every width: a row on wider screens, a column on a phone.

const FLOOR = ["Materials", "Production", "Dispatch"];

function Station({ n, name }: { n: string; name: string }) {
  return (
    <div className="relative w-full border border-slate-300 bg-white px-4 py-3.5 sm:w-auto sm:min-w-[7.5rem]">
      <span className="block text-[10px] font-semibold tracking-[0.14em] text-slate-400">
        {n}
      </span>
      <span className="mt-1 block text-sm font-semibold text-slate-900">{name}</span>
    </div>
  );
}

function Connector({ red = false }: { red?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mx-auto block h-5 w-px shrink-0 sm:mx-0 sm:h-px sm:w-5 lg:w-7 ${
        red ? "bg-brand-500" : "bg-slate-400"
      }`}
    />
  );
}

function Bracket({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span aria-hidden="true" className="relative h-px flex-1 bg-slate-300">
        <span className="absolute right-0 top-1/2 h-2 w-px -translate-y-1/2 bg-slate-300" />
      </span>
    </div>
  );
}

export default function ShiftFlow() {
  return (
    <figure className="relative">
      <div className="flex flex-col sm:flex-row sm:items-end">
        <div className="sm:flex-[3]">
          <Bracket label="Operza Factory" />
          <div className="flex flex-col sm:flex-row sm:items-center">
            {FLOOR.map((name, i) => (
              <div key={name} className="flex flex-col sm:flex-row sm:items-center">
                {i > 0 && <Connector />}
                <Station n={`0${i + 1}`} name={name} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:self-end">
          <span className="h-3 sm:hidden" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="mx-auto block h-8 w-px bg-brand-500 sm:mx-0 sm:mb-[1.55rem] sm:h-px sm:w-8 lg:w-12"
          />
        </div>

        <div className="sm:flex-1">
          <Bracket label="Operza Books" />
          <Station n="04" name="Books" />
        </div>
      </div>

      {/* The return path: in Complete, a supplier bill can also receive
          material into stock. Shown on wider screens as a red line under
          the row; the caption says it in words at every width. */}
      <div
        aria-hidden="true"
        className="ml-[3.75rem] mr-[3.75rem] mt-0 hidden h-6 border-x border-b border-brand-500 sm:block"
      />

      <figcaption className="mt-6 flex items-start gap-3 text-sm leading-6 text-slate-600">
        <span aria-hidden="true" className="mt-[0.6rem] h-px w-6 shrink-0 bg-brand-500" />
        <span>
          <span className="font-semibold text-brand-600">Operza Complete</span>{" "}
          joins the two: a dispatch records the sale in the books, and a
          supplier bill can receive its material into stock.
        </span>
      </figcaption>
    </figure>
  );
}
