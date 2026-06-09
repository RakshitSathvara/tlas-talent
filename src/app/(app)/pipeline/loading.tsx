export default function PipelineLoading() {
  return (
    <div>
      <div className="mb-10">
        <div className="mb-3 h-3 w-20 rounded bg-line" />
        <div className="mb-3 h-11 w-2/3 rounded bg-surface" />
        <div className="h-4 w-1/2 rounded bg-surface" />
      </div>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-surface" />
        ))}
      </div>

      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, col) => (
          <div key={col} className="w-[240px] flex-shrink-0 space-y-2">
            <div className="mb-3 h-3 w-24 rounded bg-line" />
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="h-24 rounded-xl border border-line bg-surface" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
