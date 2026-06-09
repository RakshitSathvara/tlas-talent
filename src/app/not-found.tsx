import { Button } from "@/components/ui/button";

// 404 (design-system.md §7.4). Editorial, no illustration.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center font-sans">
      <div className="smallcaps mb-3 text-[11px] text-accent">404</div>
      <h1 className="font-serif text-[44px] font-normal leading-[1.05] text-ink">Lost the thread.</h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-soft">
        This page slipped out of the pipeline. It may have moved, or never existed.
      </p>
      <div className="mt-6">
        <Button variant="primary" href="/dashboard">
          Back to the dashboard
        </Button>
      </div>
    </div>
  );
}
