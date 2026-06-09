import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/layout/section-label";
import { EmptyState } from "@/components/data/empty-state";
import { InterviewCard } from "@/features/interviews/components/interview-card";
import { CandidateActionBar } from "@/features/candidates/components/candidate-action-bar";
import { StageTimeline } from "@/features/candidates/components/stage-timeline";
import { ResumePreview } from "@/features/candidates/components/resume-preview";
import { ResumeUpload } from "@/features/candidates/components/resume-upload";
import { FeedbackSummaryList } from "@/features/candidates/components/feedback-summary-list";
import {
  getCandidate,
  getCandidateFeedback,
  getCandidateInterviews,
  getCandidateTimeline,
  getLatestResume,
} from "@/features/candidates/queries";
import { requireSession } from "@/lib/auth/session";
import { stageLabels } from "@/lib/tokens";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const candidate = await getCandidate(user.orgId, id);
  if (!candidate) notFound();

  const [timeline, interviews, feedback, resume] = await Promise.all([
    getCandidateTimeline(user.orgId, id),
    getCandidateInterviews(user.orgId, id),
    getCandidateFeedback(user.orgId, id),
    getLatestResume(user.orgId, id),
  ]);

  return (
    <div className="anim-up">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <Avatar initials={candidate.initials} tint={candidate.tint} size={64} />
          <div>
            <div className="smallcaps mb-2 text-[11px] text-accent">Candidate</div>
            <h1 className="font-serif text-[36px] font-normal leading-[1.05] text-ink">
              {candidate.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-soft">
              <span>
                {candidate.role} · {candidate.experience} · {candidate.location}
              </span>
              <Badge tone="neutral">{stageLabels[candidate.stage]}</Badge>
            </p>
          </div>
        </div>
        <CandidateActionBar candidate={candidate} />
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-10">
          <section>
            <SectionLabel>Timeline</SectionLabel>
            <StageTimeline events={timeline} />
          </section>

          <section>
            <SectionLabel>Interviews</SectionLabel>
            {interviews.length === 0 ? (
              <EmptyState>No interviews scheduled for this candidate yet.</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {interviews.map((interview, i) => (
                  <InterviewCard key={interview.id} interview={interview} delay={i * 60} />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionLabel>Feedback</SectionLabel>
            <FeedbackSummaryList items={feedback} />
          </section>
        </div>

        <aside>
          <SectionLabel>Résumé</SectionLabel>
          <ResumeUpload candidateId={candidate.id} resume={resume} />
          <ResumePreview candidate={candidate} />
        </aside>
      </div>
    </div>
  );
}
