import Link from "next/link";
import { Button } from "@/components/ui/button";

function pageHref(page: number, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  search.set("page", String(page));
  return `?${search.toString()}`;
}

export function OwnerPagination({
  page,
  pageCount,
  total,
  visibleCount,
  q,
  pageSize
}: {
  page: number;
  pageCount: number;
  total: number;
  visibleCount: number;
  q?: string;
  pageSize: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {visibleCount} of {total} records. Page {page} of {pageCount}.
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={pageHref(Math.max(1, page - 1), { q, pageSize: String(pageSize) })}>Previous</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>Previous</Button>
        )}
        {page < pageCount ? (
          <Button asChild variant="outline" size="sm">
            <Link href={pageHref(Math.min(pageCount, page + 1), { q, pageSize: String(pageSize) })}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>Next</Button>
        )}
      </div>
    </div>
  );
}
