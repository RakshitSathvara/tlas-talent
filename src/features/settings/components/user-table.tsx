"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/types/domain";
import type { Role } from "@/types/enums";

const roleLabels: Record<Role, string> = {
  hr: "HR",
  leadership: "Leadership",
  interviewer: "Interviewer",
  admin: "Admin",
};

function UserRow({ user }: { user: User }) {
  const [active, setActive] = useState(true);

  return (
    <li
      className={cn(
        "flex items-center gap-4 py-4 transition-opacity",
        !active && "opacity-50",
      )}
    >
      <Avatar initials={user.initials} tint={user.tint} size={32} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-ink">{user.name}</p>
        <p className="truncate text-[12px] text-ink-softer">{user.email}</p>
      </div>

      <div className="hidden w-28 shrink-0 sm:block">
        <Badge tone="neutral">{roleLabels[user.role]}</Badge>
      </div>

      <div className="hidden w-44 shrink-0 truncate text-[13px] text-ink-soft md:block">
        {user.title}
      </div>

      <div className="w-24 shrink-0 text-right">
        {active ? (
          <Button type="button" variant="ghost" onClick={() => setActive(false)}>
            Deactivate
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setActive(true)}>
            Reactivate
          </Button>
        )}
      </div>
    </li>
  );
}

/** The workspace roster: who's here, what they can do, and a way to stand them down. */
export function UserTable({ users }: { users: User[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </ul>
  );
}
