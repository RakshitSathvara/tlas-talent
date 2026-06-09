"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

// Shown on /dashboard?denied=1 when a role-route gate sent the user back here.
export function DeniedBanner() {
  const router = useRouter();
  return (
    <div className="anim-in mb-6 flex items-center justify-between gap-4 rounded-xl border border-accent-soft bg-accent-soft px-5 py-3">
      <p className="text-[13px] text-accent-ink">
        That screen isn&apos;t open to your role — here&apos;s your dashboard instead.
      </p>
      <button
        onClick={() => router.replace("/dashboard")}
        aria-label="Dismiss"
        className="text-accent-ink/70 transition-colors hover:text-accent-ink"
      >
        <X size={15} />
      </button>
    </div>
  );
}
