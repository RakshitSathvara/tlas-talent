"use client";

import { useMemo, useState } from "react";
import type { Interview } from "@/types/domain";
import type { InterviewStatus } from "@/types/enums";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/data/empty-state";
import { InterviewCard } from "./interview-card";

type TabKey = "today" | "upcoming" | "pending_feedback" | "completed";

const TABS: { key: TabKey; label: string; status: InterviewStatus }[] = [
  { key: "today", label: "Today", status: "today" },
  { key: "upcoming", label: "Upcoming", status: "upcoming" },
  { key: "pending_feedback", label: "Pending feedback", status: "pending_feedback" },
  { key: "completed", label: "Past", status: "completed" },
];

const EMPTY_COPY: Record<TabKey, string> = {
  today: "Nothing on the calendar today. A quiet day in the panel rooms.",
  upcoming: "No interviews scheduled yet. They'll land here once a round is booked.",
  pending_feedback: "All caught up — every panel has filed its notes.",
  completed: "No interviews wrapped yet.",
};

/**
 * The interviews board, tabbed by status. Today's cards carry the accent treatment;
 * each tab keeps its own count and falls back to an editorial empty state.
 */
export function InterviewsView({ interviews }: { interviews: Interview[] }) {
  const [tab, setTab] = useState<TabKey>("today");

  const byStatus = useMemo(() => {
    const groups: Record<TabKey, Interview[]> = {
      today: [],
      upcoming: [],
      pending_feedback: [],
      completed: [],
    };
    for (const iv of interviews) {
      if (iv.status in groups) groups[iv.status as TabKey].push(iv);
    }
    return groups;
  }, [interviews]);

  const items = byStatus[tab];

  return (
    <div>
      <Tabs
        className="mb-6"
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: byStatus[t.key].length,
        }))}
      />

      {items.length === 0 ? (
        <EmptyState>{EMPTY_COPY[tab]}</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((iv, i) => (
            <InterviewCard
              key={iv.id}
              interview={iv}
              accent={tab === "today"}
              delay={i * 60}
            />
          ))}
        </div>
      )}
    </div>
  );
}
