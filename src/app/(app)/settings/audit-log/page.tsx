import { PageHeading } from "@/components/layout/page-heading";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { getAuditLog } from "@/features/settings/queries";
import { requireSession } from "@/lib/auth/session";
import { DataTable, type Column } from "@/components/data/data-table";
import type { AuditEntry } from "@/types/domain";

const columns: Column<AuditEntry>[] = [
  {
    key: "at",
    header: "At",
    mono: true,
    render: (row) => row.at,
  },
  {
    key: "actor",
    header: "Actor",
    render: (row) => <span className="text-ink">{row.actor}</span>,
  },
  {
    key: "action",
    header: "Action",
    mono: true,
    render: (row) => row.action,
  },
  {
    key: "entity",
    header: "Entity",
    render: (row) => (
      <span className="text-ink-soft">
        {row.entity} <span className="font-mono text-[12px] text-ink-softer">{row.entityId}</span>
      </span>
    ),
  },
];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireSession();
  const { page } = await searchParams;
  const { rows } = await getAuditLog(user.orgId, Number(page) || 1);

  return (
    <>
      <PageHeading
        eyebrow="Audit log"
        title="Every consequential action, on the record."
        description="An append-only trail of who did what, when — read-only by design."
      />
      <SettingsNav active="audit" />
      <DataTable columns={columns} rows={rows} />
    </>
  );
}
