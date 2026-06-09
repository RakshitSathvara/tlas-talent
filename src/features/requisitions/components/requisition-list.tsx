"use client";

import { useState } from "react";
import type { Requisition } from "@/types/domain";
import type { RequisitionStatus } from "@/types/enums";
import { FilterChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/data/empty-state";
import { RequisitionCard } from "@/features/requisitions/components/requisition-card";

type Filter = "all" | RequisitionStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "pending_approval", label: "Pending approval" },
  { key: "filled", label: "Filled" },
];

export function RequisitionList({ requisitions }: { requisitions: Requisition[] }) {
  const [active, setActive] = useState<Filter>("all");

  const shown =
    active === "all" ? requisitions : requisitions.filter((req) => req.status === active);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <FilterChip key={f.key} active={active === f.key} onClick={() => setActive(f.key)}>
            {f.label}
          </FilterChip>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState>No requisitions match this filter yet.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((req) => (
            <RequisitionCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
