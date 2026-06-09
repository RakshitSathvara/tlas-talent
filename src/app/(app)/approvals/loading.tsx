// Skeleton for the approvals queue — bg-surface/bg-line blocks, no spinner.
export default function ApprovalsLoading() {
  return (
    <div className="anim-in">
      <div className="mb-10">
        <div className="mb-3 h-3 w-20 rounded bg-line" />
        <div className="mb-3 h-10 w-[28rem] max-w-full rounded bg-line" />
        <div className="h-4 w-full max-w-xl rounded bg-line" />
      </div>

      <div className="mb-4 h-2.5 w-24 rounded bg-line" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-line" />
              <div className="flex-1">
                <div className="mb-2 h-2.5 w-20 rounded bg-line" />
                <div className="mb-2 h-5 w-48 rounded bg-line" />
                <div className="h-3 w-64 max-w-full rounded bg-line" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
