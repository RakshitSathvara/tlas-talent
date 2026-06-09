import { Plus, TrendingUp } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalCard } from "@/features/approvals/components/approval-card";
import { RequisitionCard } from "@/features/requisitions/components/requisition-card";
import { Sparkline } from "@/components/data/sparkline";
import { Funnel } from "@/components/data/funnel";
import { ProgressBar } from "@/components/data/progress-bar";
import type { LeadershipDashboardData } from "@/features/dashboard/queries";
import { stageColors } from "@/lib/tokens";
import { spellTitle } from "@/lib/format";

export function LeadershipDashboard({ data }: { data: LeadershipDashboardData }) {
  const { approvals, myRequisitions, funnel, timeToHireSeries, offerAcceptance, reportHeadline } =
    data;
  const pending = approvals.length;
  const acceptPct = Math.round((offerAcceptance.accepted / offerAcceptance.total) * 100);

  return (
    <>
      <PageHeading
        eyebrow="Leadership"
        title={`${spellTitle(pending)} things need you today.`}
        description="Two requisitions and one offer await your sign-off. Hiring velocity is steady — time-to-hire down 14% on the quarter."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionLabel
            right={<span className="font-mono text-[12px] text-ink-softer">{pending} pending</span>}
          >
            Awaiting approval
          </SectionLabel>
          <div className="mb-12 space-y-3">
            {approvals.map((a, i) => (
              <ApprovalCard key={a.id} approval={a} delay={60 + i * 80} />
            ))}
          </div>

          <SectionLabel
            right={
              <Button variant="secondary" href="/requisitions/new">
                <Plus size={12} /> New requisition
              </Button>
            }
          >
            My requisitions
          </SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {myRequisitions.map((r) => (
              <RequisitionCard key={r.id} req={r} />
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <SectionLabel className="mb-0">Hiring velocity</SectionLabel>
          <Card className="anim-up">
            <div className="mb-1 flex items-baseline justify-between">
              <div>
                <div className="font-serif text-[40px] font-normal leading-none text-ink">
                  {reportHeadline.medianDaysToHire}
                </div>
                <div className="smallcaps mt-2 text-[10px] text-ink-softer">median days to hire</div>
              </div>
              <div className="flex items-center gap-1 font-mono text-[12px] text-stage-offer">
                <TrendingUp size={11} /> {reportHeadline.deltaPct}%
              </div>
            </div>
            <Sparkline points={timeToHireSeries} />
          </Card>

          <Card className="anim-up">
            <div className="smallcaps mb-3 text-[10px] text-ink-softer">Funnel · this quarter</div>
            <Funnel stages={funnel} />
          </Card>

          <Card className="anim-up">
            <div className="smallcaps mb-3 text-[10px] text-ink-softer">Offer acceptance</div>
            <div className="flex items-baseline justify-between">
              <div className="font-serif text-[40px] font-normal leading-none text-ink">
                {acceptPct}
                <span className="text-ink-softer" style={{ fontSize: 24 }}>
                  %
                </span>
              </div>
              <div className="font-mono text-[11px] text-ink-soft">
                {offerAcceptance.accepted} of {offerAcceptance.total}
              </div>
            </div>
            <ProgressBar value={acceptPct} color={stageColors.offer} height={6} className="mt-3" />
          </Card>
        </aside>
      </div>
    </>
  );
}
