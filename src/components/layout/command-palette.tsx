"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useUiStore } from "@/stores/ui-store";
import { useRole } from "@/hooks/use-role";
import { navForRole } from "@/lib/nav";
import { candidates } from "@/lib/mock/candidates";
import { requisitions } from "@/lib/mock/requisitions";

interface Result {
  href: string;
  label: string;
  hint: string;
}

// Global ⌘K palette (frontend-architecture.md §13.3): navigation + candidate/req search.
export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const { role } = useRole();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const nav: Result[] = navForRole(role).map((n) => ({
      href: n.href,
      label: n.label,
      hint: "Go to",
    }));
    const cands: Result[] = candidates.map((c) => ({
      href: `/candidates/${c.id}`,
      label: c.name,
      hint: c.role,
    }));
    const reqs: Result[] = requisitions.map((r) => ({
      href: `/requisitions/${r.id}`,
      label: r.title,
      hint: `${r.team} · requisition`,
    }));
    const all = [...nav, ...cands, ...reqs];
    if (!q) return nav;
    return all.filter((r) => r.label.toLowerCase().includes(q) || r.hint.toLowerCase().includes(q)).slice(0, 8);
  }, [query, role]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="max-w-[520px]">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Search size={16} className="text-ink-softer" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0].href);
          }}
          placeholder="Search candidates, requisitions, or jump to…"
          className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-softer"
        />
      </div>
      <ul className="max-h-[320px] overflow-y-auto py-2">
        {results.length === 0 && (
          <li className="px-5 py-6 text-center text-[12px] text-ink-softer">Nothing matches that — yet.</li>
        )}
        {results.map((r) => (
          <li key={r.href + r.label}>
            <button
              onClick={() => go(r.href)}
              className="flex w-full items-center justify-between px-5 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
            >
              <span className="text-[13.5px] text-ink">{r.label}</span>
              <span className="font-mono text-[11px] text-ink-softer">{r.hint}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[11px] text-ink-softer">
        <span>Search</span>
        <span className="flex items-center gap-1 font-mono">
          <CornerDownLeft size={11} /> to open
        </span>
      </div>
    </Modal>
  );
}
