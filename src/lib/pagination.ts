// One pagination helper for every list query (BACKEND-ARCHITECTURE.md §7). Offset pagination
// by default (small org, page-jumping UI); the audit log switches to keyset.
import { z } from "zod";

export const pageInput = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type Page = z.infer<typeof pageInput>;

export const toOffset = (p: Page) => ({ limit: p.pageSize, offset: (p.page - 1) * p.pageSize });

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export const paged = <T>(rows: T[], total: number, p: Page): Paged<T> => ({
  rows,
  total,
  page: p.page,
  pageSize: p.pageSize,
  pageCount: Math.ceil(total / p.pageSize),
});
