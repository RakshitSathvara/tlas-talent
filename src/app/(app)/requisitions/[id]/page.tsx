import Link from "next/link";
import { notFound } from "next/navigation";
import type { RequisitionStatus } from "@/types/enums";
import { Badge, PriorityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/layout/section-label";
import { ApprovalChainStepper } from "@/features/requisitions/components/approval-chain-stepper";
import { ApplicantTable } from "@/features/requisitions/components/applicant-table";
import {
  getApplicants,
  getRequisition,
  getRequisitionApprovalChain,
} from "@/features/requisitions/queries";
import { requireSession } from "@/lib/auth/session";

const statusLabels: Record<RequisitionStatus, string> = {
  open: "Open",
  pending_approval: "Pending approval",
  filled: "Filled",
  closed: "Closed",
};

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const req = await getRequisition(user.orgId, id);
  if (!req) notFound();

  const [chain, applicants] = await Promise.all([
    getRequisitionApprovalChain(user.orgId, id),
    getApplicants(user.orgId, id),
  ]);

  return (
    <div className="anim-up">
      {/* Editorial header */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="smallcaps mb-3 text-[11px] text-accent">Requisition</div>
          <h1 className="mb-2 font-serif text-[36px] font-normal leading-[1.08] text-ink">
            {req.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[14px] text-ink-soft">
              {req.team} · {req.location} · {req.band}
            </p>
            <Badge tone={req.status === "open" ? "accent" : "neutral"}>
              {statusLabels[req.status]}
            </Badge>
            <PriorityBadge priority={req.priority} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Button href={`/requisitions/${req.id}/edit`} variant="secondary">
            Edit
          </Button>
          <Link
            href="/requisitions"
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-ink-soft transition-all duration-200 hover:bg-black/[0.04]"
          >
            Close requisition
          </Link>
        </div>
      </div>

      {/* Description */}
      <div className="mb-10 max-w-3xl">
        <Card>
          <p className="text-[14.5px] leading-relaxed text-ink-soft">
            {req.description ?? "No description has been added for this role yet."}
          </p>
          <div className="mt-4 flex flex-wrap gap-6 border-t border-line pt-4">
            <Stat label="Openings" value={`${req.filled}/${req.openings}`} />
            <Stat label="In pipeline" value={String(req.pipeline)} />
            <Stat label="Days open" value={`${req.daysOpen}d`} />
            <Stat label="Raised by" value={req.raisedBy} mono={false} />
          </div>
        </Card>
      </div>

      {/* Approval chain */}
      <div className="mb-10 max-w-3xl">
        <SectionLabel>Approval chain</SectionLabel>
        <Card>
          <ApprovalChainStepper steps={chain} />
        </Card>
      </div>

      {/* Applicants */}
      <div>
        <SectionLabel>Applicants</SectionLabel>
        <ApplicantTable candidates={applicants} />
      </div>
    </div>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="smallcaps mb-1 text-[10px] text-ink-softer">{label}</div>
      <div className={mono ? "font-mono text-[13px] text-ink" : "text-[13px] text-ink"}>
        {value}
      </div>
    </div>
  );
}
