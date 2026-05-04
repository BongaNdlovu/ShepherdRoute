import type { OwnerPaginatedResult } from "./types";

export function normalizeOwnerPage(value?: string) {
  return Math.max(1, Number(value ?? 1) || 1);
}

export function normalizeOwnerPageSize(value?: string) {
  return Math.min(100, Math.max(10, Number(value ?? 25) || 25));
}

export function ownerPageResult<T>(items: T[], total: number, page: number, pageSize: number): OwnerPaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize))
  };
}
