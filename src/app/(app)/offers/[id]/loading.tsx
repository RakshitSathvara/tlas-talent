// Skeleton for the offer detail — bg-surface/bg-line blocks, no spinner.
export default function OfferDetailLoading() {
  return (
    <div className="anim-in grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
      <div>
        <div className="mb-8 flex items-start gap-4">
          <div className="h-[52px] w-[52px] rounded-full bg-line" />
          <div className="flex-1">
            <div className="mb-3 h-2.5 w-12 rounded bg-line" />
            <div className="mb-2 h-9 w-64 max-w-full rounded bg-line" />
            <div className="h-3 w-40 rounded bg-line" />
          </div>
        </div>

        <div className="mb-8 h-3 w-full max-w-md rounded bg-line" />

        <div className="mb-4 h-2.5 w-16 rounded bg-line" />
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-full rounded bg-line" />
            ))}
          </div>
        </div>

        <div className="mb-4 mt-10 h-2.5 w-28 rounded bg-line" />
        <div className="h-24 rounded-xl border border-line bg-surface" />
      </div>

      <div className="min-h-[560px] rounded-xl border border-line bg-surface" />
    </div>
  );
}
