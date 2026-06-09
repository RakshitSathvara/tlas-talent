// Skeleton for the candidate directory — surface/line blocks, no spinner.
export default function CandidatesLoading() {
  return (
    <div className="anim-in">
      <div className="mb-10">
        <div className="mb-3 h-3 w-24 rounded bg-line" />
        <div className="mb-3 h-11 w-2/3 rounded bg-surface" />
        <div className="h-4 w-1/2 rounded bg-surface" />
      </div>

      <div className="mb-5 h-11 w-full max-w-md rounded-lg bg-surface" />

      <div className="mb-7 flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-surface" />
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
          >
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-line" />
            <div className="min-w-0 flex-1">
              <div className="mb-2 h-3.5 w-40 rounded bg-line" />
              <div className="h-3 w-28 rounded bg-line" />
            </div>
            <div className="h-3 w-24 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
