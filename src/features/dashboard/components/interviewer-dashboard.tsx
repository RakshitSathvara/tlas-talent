"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data/empty-state";
import { InterviewCard } from "@/features/interviews/components/interview-card";
import { FeedbackModal } from "@/features/interviews/components/feedback-modal";
import type { InterviewerDashboardData } from "@/features/dashboard/queries";

export function InterviewerDashboard({ data }: { data: InterviewerDashboardData }) {
  const [tab, setTab] = useState("upcoming");
  const [calloutOpen, setCalloutOpen] = useState(false);

  const today = data.interviews.filter((i) => i.status === "today");
  const upcoming = data.interviews.filter((i) => i.status === "upcoming");
  const pending = data.interviews.filter((i) => i.status === "pending_feedback");

  return (
    <>
      <PageHeading
        eyebrow="Your day"
        title="Two interviews, one feedback overdue."
        description="Vikram joins in 47 minutes for the R2 technical. Tanvi's feedback has been waiting since yesterday — it blocks her advance."
      />

      {pending.length > 0 && (
        <div
          className="anim-up mb-10 flex items-center gap-4 rounded-xl border border-accent-soft bg-accent-soft p-5"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-surface">
            <MessageSquare size={16} />
          </div>
          <div className="flex-1">
            <div className="font-serif text-[18px] font-medium text-accent-ink">
              Feedback awaits for {pending[0].candidate}
            </div>
            <p className="mt-0.5 text-[13px] text-accent-ink/80">
              Until you submit, the candidate stays in interview stage.
            </p>
          </div>
          <Button variant="accent" className="bg-accent-ink" onClick={() => setCalloutOpen(true)}>
            Submit feedback
          </Button>
        </div>
      )}

      {today.length > 0 && (
        <div className="mb-12">
          <SectionLabel>Today</SectionLabel>
          <div className="space-y-3">
            {today.map((iv, i) => (
              <InterviewCard key={iv.id} interview={iv} accent delay={120 + i * 80} />
            ))}
          </div>
        </div>
      )}

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { key: "upcoming", label: "Upcoming", count: upcoming.length },
          { key: "pending", label: "Pending feedback", count: pending.length },
          { key: "past", label: "Past", count: data.pastCount },
        ]}
      />

      <div key={tab} className="anim-in">
        {tab === "upcoming" && (
          <div className="space-y-3">
            {upcoming.map((iv, i) => (
              <InterviewCard key={iv.id} interview={iv} delay={i * 80} />
            ))}
            {upcoming.length === 0 && <EmptyState>No interviews coming up — yet.</EmptyState>}
          </div>
        )}
        {tab === "pending" && (
          <div className="space-y-3">
            {pending.map((iv, i) => (
              <InterviewCard key={iv.id} interview={iv} delay={i * 80} />
            ))}
            {pending.length === 0 && <EmptyState>Nothing waiting on you. Good.</EmptyState>}
          </div>
        )}
        {tab === "past" && (
          <Card>
            <p className="text-[13px] text-ink-soft">
              Past interview history — {data.pastCount} entries this quarter.
            </p>
          </Card>
        )}
      </div>

      {pending[0] && (
        <FeedbackModal
          interview={pending[0]}
          open={calloutOpen}
          onClose={() => setCalloutOpen(false)}
        />
      )}
    </>
  );
}
