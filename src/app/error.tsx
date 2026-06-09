"use client";

import { Button } from "@/components/ui/button";

// Editorial error boundary (design-system.md §7.4).
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans">
      <div className="smallcaps mb-3 text-[11px] text-accent">Something broke</div>
      <h1 className="font-serif text-[44px] font-normal leading-[1.05] text-ink">
        That didn&apos;t go to plan.
      </h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-soft">
        An unexpected error interrupted the page. Trying again usually clears it.
      </p>
      <div className="mt-6">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
