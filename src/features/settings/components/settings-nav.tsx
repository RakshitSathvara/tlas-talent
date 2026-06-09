"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "team" | "templates" | "pipeline" | "audit";

const tabs: { key: SettingsTab; label: string; href: string }[] = [
  { key: "profile", label: "Profile", href: "/settings" },
  { key: "team", label: "Team", href: "/settings/team" },
  { key: "templates", label: "Templates", href: "/settings/templates" },
  { key: "pipeline", label: "Pipeline config", href: "/settings/pipeline-config" },
  { key: "audit", label: "Audit log", href: "/settings/audit-log" },
];

/** Underlined sub-nav for the settings section (mirrors the Tabs treatment). */
export function SettingsNav({ active }: { active: SettingsTab }) {
  return (
    <nav className="mb-8 flex items-center gap-1 border-b border-line">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "relative px-3 py-2.5 text-[13px] font-medium transition-colors",
              isActive ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
            {isActive && <span className="absolute -bottom-px left-0 right-0 h-px bg-ink" />}
          </Link>
        );
      })}
    </nav>
  );
}
