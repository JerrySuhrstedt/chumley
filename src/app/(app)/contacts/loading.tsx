/**
 * Same idea as the board: paint the list's shape while a thousand rows
 * are still coming down the wire.
 */
export default function ContactsLoading() {
  return (
    <div className="flex-1 animate-pulse overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-6 w-28 rounded bg-slate-200" />
            <div className="mt-2 h-3.5 w-72 rounded bg-slate-200/70" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-full rounded-md bg-slate-200 sm:w-72" />
            <div className="h-10 w-44 rounded-md bg-slate-200" />
            <div className="h-10 w-24 rounded-md bg-slate-200" />
          </div>
        </div>

        <div className="mb-4 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-28 rounded-full bg-slate-200" />
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <div className="size-9 shrink-0 rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-40 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-64 rounded bg-slate-100" />
                </div>
                <div className="hidden gap-1 sm:flex">
                  {[0, 1, 2].map((b) => (
                    <div key={b} className="size-9 rounded-md bg-slate-100" />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
