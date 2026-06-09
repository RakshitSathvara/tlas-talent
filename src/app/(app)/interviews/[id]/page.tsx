import { notFound } from "next/navigation";
import { Clock, Video, MapPin, Calendar, Users, Star } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getInterview, getInterviewFeedback } from "@/features/interviews/queries";
import { getCandidateBrief } from "@/features/candidates/queries";
import { InterviewFeedbackTrigger } from "@/features/interviews/components/interview-feedback-trigger";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/layout/section-label";
import { EmptyState } from "@/components/data/empty-state";
import { formatDate } from "@/lib/format";
import type { Feedback } from "@/types/domain";
import type { Recommendation } from "@/types/enums";

const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  strong_yes: "Strong yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

const RATING_LABELS: { key: keyof Feedback["ratings"]; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "communication", label: "Communication" },
  { key: "roleFit", label: "Role fit" },
  { key: "cultural", label: "Cultural" },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={11}
          className={n <= value ? "text-ink" : "text-ink-softer"}
          fill={n <= value ? "currentColor" : "transparent"}
        />
      ))}
    </span>
  );
}

function FeedbackEntry({ entry, delay }: { entry: Feedback; delay: number }) {
  return (
    <div className="anim-up" style={{ animationDelay: `${delay}ms` }}>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-medium leading-tight text-ink">{entry.interviewer}</h3>
            <p className="mt-0.5 text-[12px] text-ink-soft">{entry.round}</p>
          </div>
          <Badge tone={entry.recommendation === "no" ? "muted" : "accent"}>
            {RECOMMENDATION_LABELS[entry.recommendation]}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {RATING_LABELS.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-2">
              <span className="text-[12px] text-ink-soft">{r.label}</span>
              <Stars value={entry.ratings[r.key]} />
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-line pt-3 text-[13px] leading-relaxed text-ink-soft">
          {entry.notes}
        </p>
        <div className="mt-3 font-mono text-[10px] text-ink-softer">
          Filed {formatDate(entry.submittedOn)}
        </div>
      </Card>
    </div>
  );
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-ink">
      <span className="text-ink-softer">{icon}</span>
      {children}
    </div>
  );
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const interview = await getInterview(user.orgId, id);
  if (!interview) notFound();

  const panelFeedback = await getInterviewFeedback(user.orgId, id);
  // Redacted brief for the panel — deliberately omits compensation (BACKEND-ARCHITECTURE.md §3.4).
  const candidate = await getCandidateBrief(user.orgId, interview.candidateId, user.id);
  const isVideo = interview.mode === "video";

  return (
    <div>
      {/* Editorial header */}
      <div className="anim-up mb-10 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <Avatar initials={interview.initials} tint={interview.tint} size={64} />
          <div>
            <div className="smallcaps mb-2 text-[11px] text-accent">{interview.round}</div>
            <h1 className="font-serif text-[36px] font-normal leading-[1.05] text-ink">
              {interview.candidate}
            </h1>
            <p className="mt-2 text-[14px] text-ink-soft">
              {interview.role} · {isVideo ? "Video call" : "In-person"}
            </p>
          </div>
        </div>
        <div className="pt-1">
          <InterviewFeedbackTrigger interview={interview} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — brief + schedule */}
        <div className="space-y-8">
          <div>
            <SectionLabel>Candidate brief</SectionLabel>
            <Card>
              {/* Note: panellists do not see expected CTC or other panellists' scores
                  before filing — so this brief deliberately omits compensation. */}
              {candidate ? (
                <dl className="space-y-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[12px] text-ink-soft">Role</dt>
                    <dd className="text-[13px] font-medium text-ink">{candidate.role}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[12px] text-ink-soft">Experience</dt>
                    <dd className="font-mono text-[13px] text-ink">{candidate.experience}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[12px] text-ink-soft">Location</dt>
                    <dd className="text-[13px] text-ink">{candidate.location}</dd>
                  </div>
                  {candidate.summary && (
                    <div className="border-t border-line pt-3">
                      <p className="text-[13px] leading-relaxed text-ink-soft">
                        {candidate.summary}
                      </p>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-[13px] text-ink-soft">{interview.role}</p>
              )}
            </Card>
          </div>

          <div>
            <SectionLabel>Schedule</SectionLabel>
            <Card>
              <div className="space-y-3">
                <DetailRow icon={<Clock size={14} />}>
                  <span className="font-mono">{interview.time}</span>
                </DetailRow>
                <DetailRow icon={<Calendar size={14} />}>{interview.date}</DetailRow>
                <DetailRow icon={<Clock size={14} />}>{interview.duration}</DetailRow>
                <DetailRow icon={isVideo ? <Video size={14} /> : <MapPin size={14} />}>
                  {isVideo ? "Video call" : "In-person"}
                </DetailRow>
                <div className="border-t border-line pt-3">
                  <div className="mb-2 flex items-center gap-2.5 text-[12px] text-ink-soft">
                    <Users size={14} className="text-ink-softer" />
                    Panel
                  </div>
                  <ul className="space-y-1.5 pl-[26px]">
                    {interview.panel.map((p) => (
                      <li key={p} className="text-[13px] text-ink">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT — feedback so far */}
        <div>
          <SectionLabel>Feedback so far</SectionLabel>
          {panelFeedback.length === 0 ? (
            <EmptyState>No feedback filed yet. The panel's notes will appear here.</EmptyState>
          ) : (
            <div className="space-y-3">
              {panelFeedback.map((entry, i) => (
                <FeedbackEntry key={entry.id} entry={entry} delay={i * 70} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
