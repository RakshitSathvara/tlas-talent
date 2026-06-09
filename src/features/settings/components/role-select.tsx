"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/enums";

const ROLES: { key: Role; label: string }[] = [
  { key: "hr", label: "HR" },
  { key: "leadership", label: "Leadership" },
  { key: "interviewer", label: "Interviewer" },
  { key: "admin", label: "Admin" },
];

/**
 * A small pill segmented control over the four roles. Owns local selection but
 * defers to `value` as the seed; reports changes through `onChange`.
 */
export function RoleSelect({
  value,
  onChange,
}: {
  value: Role;
  onChange?: (r: Role) => void;
}) {
  const [selected, setSelected] = useState<Role>(value);

  function pick(role: Role) {
    setSelected(role);
    onChange?.(role);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1">
      {ROLES.map((r) => {
        const active = r.key === selected;
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => pick(r.key)}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-colors duration-200",
              active ? "bg-ink text-surface" : "text-ink-soft hover:text-ink",
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
