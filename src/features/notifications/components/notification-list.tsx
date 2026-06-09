"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ClipboardCheck,
  FileText,
  TriangleAlert,
  User,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification } from "@/types/domain";
import type { NotificationKind } from "@/types/enums";
import { EmptyState } from "@/components/data/empty-state";
import { markNotificationRead, markAllNotificationsRead } from "@/features/notifications/actions";

// Each kind gets a quiet icon — colour stays neutral so stage hues stay reserved
// for the pipeline (design-system.md). The icon sits on a faint surface badge.
const kindIcon: Record<NotificationKind, LucideIcon> = {
  approval: ClipboardCheck,
  interview: Calendar,
  offer: FileText,
  candidate: User,
  system: TriangleAlert,
};

export function NotificationList({ items }: { items: AppNotification[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <EmptyState>Nothing needs your attention right now.</EmptyState>;
  }

  const hasUnread = items.some((n) => !n.read);

  // Mark a single notification read on open, then follow its link (the row resolves to read).
  function openAndRead(id: string) {
    startTransition(async () => {
      await markNotificationRead({ id });
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            disabled={pending}
            className="smallcaps text-[11px] text-ink-soft transition-colors duration-200 hover:text-ink disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((n) => {
          const Icon = kindIcon[n.kind];
          return (
            <li key={n.id}>
              <Link
                href={n.href}
                onClick={() => !n.read && openAndRead(n.id)}
                className="lift flex items-start gap-4 rounded-xl border border-line bg-surface p-4"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-ink-soft">
                  <Icon size={16} strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14px] font-medium text-ink">{n.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-ink-softer">{n.when}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-ink-soft">{n.body}</p>
                </div>

                {!n.read && (
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    aria-label="Unread"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
