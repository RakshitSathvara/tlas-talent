"use client";

import { useEffect } from "react";
import { Header } from "./header";
import { CommandPalette } from "./command-palette";
import { useUiStore } from "@/stores/ui-store";

/**
 * The authenticated shell (frontend-architecture.md §5.1): header + nav + the global
 * ⌘K command palette. A client boundary so it can own the keybinding, but pages passed
 * as `children` stay server components.
 */
export function AppShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  unreadCount?: number;
}) {
  const toggleCommand = useUiStore((s) => s.toggleCommand);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCommand]);

  return (
    <div className="min-h-screen w-full font-sans">
      <Header unreadCount={unreadCount} />
      <main className="mx-auto max-w-[1320px] px-8 pb-24 pt-6">{children}</main>
      <CommandPalette />
    </div>
  );
}
