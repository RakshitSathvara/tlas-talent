"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/use-role";
import { logout } from "@/features/auth/actions";
import type { Role } from "@/types/enums";

const ROLE_LABEL: Record<Role, string> = {
  hr: "HR",
  leadership: "Leadership",
  interviewer: "Interviewer",
  admin: "Admin",
};

/** Avatar dropdown: who you're signed in as, a link to settings, and log out. */
export function UserMenu() {
  const { user, role } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ink"
      >
        <Avatar initials={user.initials} tint={user.tint} size={32} />
      </button>

      {open && (
        <div
          role="menu"
          className="anim-in absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-line bg-surface"
          style={{ boxShadow: "0 12px 36px -16px rgba(26,24,22,0.28)" }}
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-4">
            <Avatar initials={user.initials} tint={user.tint} size={36} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-ink">{user.name}</div>
              <div className="truncate text-[12px] text-ink-soft">{user.email}</div>
              <div className="mt-1.5">
                <Badge tone="neutral">{ROLE_LABEL[role]}</Badge>
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-ink transition-colors hover:bg-black/[0.03]"
          >
            <Settings size={15} className="text-ink-soft" />
            Settings
          </Link>

          <form action={logout} className="border-t border-line">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] text-ink transition-colors hover:bg-black/[0.03]"
            >
              <LogOut size={15} className="text-ink-soft" />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
