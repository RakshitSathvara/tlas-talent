// Skeleton for the offers list — bg-surface/bg-line blocks, no spinner.
export default function OffersLoading() {
  return (
    <div className="anim-in">
      <div className="mb-10">
        <div className="mb-3 h-3 w-16 rounded bg-line" />
        <div className="mb-3 h-10 w-96 max-w-full rounded bg-line" />
        <div className="h-4 w-full max-w-2xl rounded bg-line" />
      </div>

      <div className="border-b border-line px-4 pb-2.5">
        <div className="h-2.5 w-24 rounded bg-line" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-8 w-8 rounded-full bg-line" />
            <div className="h-3 w-40 rounded bg-line" />
            <div className="ml-auto h-3 w-20 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
