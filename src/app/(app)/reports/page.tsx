import { ArrowDownRight } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { Card } from "@/components/ui/card";
import { Funnel } from "@/components/data/funnel";
import { Sparkline } from "@/components/data/sparkline";
import { ProgressBar } from "@/components/data/progress-bar";
import { getReportingMetrics } from "@/features/reports/queries";
import { BarList } from "@/features/reports/components/bar-list";
import { requireSession } from "@/lib/auth/session";
import { c } from "@/lib/tokens";

export default async function ReportsPage() {
  const user = await requireSession();
  const {
    funnel,
    timeToHireSeries,
    offerAcceptance,
    sourceOfHire,
    interviewerLoad,
    dropOffByStage,
    reportHeadline,
  } = await getReportingMetrics(user.orgId);

  const { medianDaysToHire, deltaPct, offerAcceptanceRate } = reportHeadline;
  const faster = deltaPct < 0;

  return (
    <div>
      <PageHeading
        eyebrow="Reports"
        title="The quarter, read upward."
        description={`Median time to hire is down to ${medianDaysToHire} days, ${Math.abs(deltaPct)}% ${faster ? "faster" : "slower"} than last quarter, and ${offerAcceptanceRate}% of offers landed.`}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Hiring funnel */}
        <Card>
          <SectionLabel>Hiring funnel · this quarter</SectionLabel>
          <Funnel stages={funnel} />
        </Card>

        {/* Time to hire */}
        <Card>
          <SectionLabel>Time to hire</SectionLabel>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-serif text-[40px] font-normal leading-none text-ink">
              {medianDaysToHire}
            </span>
            <span className="text-[13px] text-ink-soft">days, median</span>
            <span className="ml-auto flex items-center gap-1 font-mono text-[12px] text-stage-offer">
              {faster && <ArrowDownRight size={12} />}
              {Math.abs(deltaPct)}%
            </span>
          </div>
          <Sparkline points={timeToHireSeries} />
          <p className="mt-3 text-[12px] text-ink-softer">Last ten weeks, newest at right.</p>
        </Card>

        {/* Offer acceptance */}
        <Card>
          <SectionLabel>Offer acceptance</SectionLabel>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-serif text-[40px] font-normal leading-none text-ink">
              {offerAcceptanceRate}%
            </span>
            <span className="text-[13px] text-ink-soft">
              {offerAcceptance.accepted} of {offerAcceptance.total} offers accepted
            </span>
          </div>
          <ProgressBar value={offerAcceptanceRate} color={c.accent} />
        </Card>

        {/* Source of hire */}
        <Card>
          <SectionLabel>Source of hire</SectionLabel>
          <BarList data={sourceOfHire} />
        </Card>

        {/* Interviewer load */}
        <Card>
          <SectionLabel>Interviewer load</SectionLabel>
          <BarList
            data={interviewerLoad.map((i) => ({ label: i.name, value: i.count }))}
          />
        </Card>

        {/* Drop-off by stage */}
        <Card>
          <SectionLabel>Drop-off by stage</SectionLabel>
          <BarList
            data={dropOffByStage.map((d) => ({ label: d.stage, value: d.rate }))}
            suffix="%"
          />
        </Card>
      </div>
    </div>
  );
}
