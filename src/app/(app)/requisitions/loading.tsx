export default function RequisitionsLoading() {
  return (
    <div>
      <div className="mb-10 space-y-3">
        <div className="h-3 w-20 rounded bg-line" />
        <div className="h-10 w-2/3 rounded bg-surface" />
        <div className="h-4 w-1/2 rounded bg-surface" />
      </div>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-surface" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
