// Skeleton for the reports route — bg-surface/bg-line blocks, no spinner.
export default function ReportsLoading() {
  return (
    <div className="anim-in">
      <div className="mb-10">
        <div className="mb-3 h-3 w-20 rounded bg-line" />
        <div className="mb-3 h-10 w-80 max-w-full rounded bg-line" />
        <div className="h-4 w-full max-w-2xl rounded bg-line" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5">
            <div className="mb-5 h-3 w-32 rounded bg-line" />
            <div className="space-y-3">
              <div className="h-2.5 w-full rounded-full bg-line" />
              <div className="h-2.5 w-5/6 rounded-full bg-line" />
              <div className="h-2.5 w-2/3 rounded-full bg-line" />
              <div className="h-2.5 w-1/2 rounded-full bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
