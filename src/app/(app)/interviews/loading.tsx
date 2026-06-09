export default function InterviewsLoading() {
  return (
    <div>
      <div className="mb-10">
        <div className="mb-3 h-3 w-24 rounded bg-line" />
        <div className="mb-3 h-11 w-1/2 rounded bg-surface" />
        <div className="h-4 w-2/3 rounded bg-surface" />
      </div>

      <div className="mb-6 flex gap-4 border-b border-line pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-24 rounded bg-surface" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
