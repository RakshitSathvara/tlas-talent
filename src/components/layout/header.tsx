"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { UserMenu } from "./user-menu";
import { Nav } from "./nav";
import { NotificationsSubscriber } from "./notifications-subscriber";
import { useUiStore } from "@/stores/ui-store";
import { formatLongDate } from "@/lib/format";

export function Header({ unreadCount = 0 }: { unreadCount?: number }) {
  const toggleCommand = useUiStore((s) => s.toggleCommand);

  // Render the date after mount to keep server and client markup identical.
  const [today, setToday] = useState("");
  useEffect(() => setToday(formatLongDate(new Date())), []);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-sm">
      {/* Keeps the bell live via Realtime; the dashboard activity feed / approvals queue can opt
          into the same hook (useRealtimeRefresh with table:'activities' / 'approval_requests'). */}
      <NotificationsSubscriber />
      <div className="mx-auto max-w-[1320px] px-8">
        <div className="flex items-center gap-8 py-5">
          {/* Wordmark */}
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="font-serif text-2xl text-ink">Atlas</span>
            <span className="smallcaps text-[10px] text-accent">talent</span>
          </Link>

          {/* Today */}
          <div className="hidden items-center gap-3 text-ink-soft md:flex">
            <div className="h-4 w-px bg-line-strong" />
            <span className="text-[13px]">{today}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <IconButton aria-label="Search" onClick={toggleCommand}>
              <Search size={16} />
            </IconButton>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-black/[0.04]"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </Link>
            <div className="mx-2 h-6 w-px bg-line" />
            <UserMenu />
          </div>
        </div>

        {/* Primary nav */}
        <div className="-mx-1 pb-2">
          <Nav />
        </div>
      </div>
    </header>
  );
}
