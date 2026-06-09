import Link from "next/link";
import { Users, FileText, SlidersHorizontal, ScrollText, ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { StatCard } from "@/components/data/stat-card";
import { Card } from "@/components/ui/card";
import type { AdminDashboardData } from "@/features/dashboard/queries";

const LINKS = [
  { href: "/settings/team", label: "Users & roles", note: "Invite, change roles, deactivate", icon: Users },
  { href: "/settings/templates", label: "Templates", note: "Email, JD, and offer templates", icon: FileText },
  { href: "/settings/pipeline-config", label: "Pipeline config", note: "Stages, SLAs, approval chains", icon: SlidersHorizontal },
  { href: "/settings/audit-log", label: "Audit log", note: "Every mutation, append-only", icon: ScrollText },
];

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <>
      <PageHeading
        eyebrow="System"
        title="The system, at a glance."
        description="Eight people across four roles, six requisitions in flight, and a clean audit trail. Configuration is quiet — which is how it should be."
      />

      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="People" value={data.stats.people} eyebrow="across 4 roles" delay={60} />
        <StatCard label="Requisitions" value={data.stats.requisitions} eyebrow="in flight" delay={120} />
        <StatCard label="Templates" value={data.stats.templates} eyebrow="email · jd · offer" delay={180} />
        <StatCard label="Audit events" value={data.stats.auditEvents} eyebrow="this week" delay={240} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionLabel>Configuration</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="lift flex items-center gap-4 rounded-xl border border-line bg-surface p-5"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-line text-ink-soft">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-ink">{l.label}</div>
                    <div className="mt-0.5 text-[12px] text-ink-soft">{l.note}</div>
                  </div>
                  <ChevronRight size={14} className="text-ink-softer" />
                </Link>
              );
            })}
          </div>
        </div>

        <aside>
          <SectionLabel>Recent system activity</SectionLabel>
          <Card padded={false} className="overflow-hidden">
            <ul>
              {data.recentAudit.map((e, i) => (
                <li
                  key={e.id}
                  className={`px-5 py-3.5 ${i !== 0 ? "border-t border-line" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[12px] text-ink">{e.action}</span>
                    <span className="font-mono text-[10px] text-ink-softer">{e.at.slice(5)}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-soft">
                    {e.actor} · {e.entity} {e.entityId}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
