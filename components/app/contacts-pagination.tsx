import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ContactsPaginationParams = {
  q?: string;
  status?: string;
  interest?: string;
  event?: string;
  assignedTo?: string;
  pageSize?: string;
};

type ContactsPaginationProps = {
  params: ContactsPaginationParams;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  visibleCount: number;
};

function pageHref(params: ContactsPaginationParams, targetPage: number) {
  const search = new URLSearchParams();

  for (const key of ["q", "status", "interest", "event", "assignedTo", "pageSize"] as const) {
    const value = params[key];
    if (value && value !== "all") {
      search.set(key, value);
    }
  }

  search.set("page", String(targetPage));
  return `/contacts?${search.toString()}`;
}

export function ContactsPagination({ params, page, pageCount, pageSize, total, visibleCount }: ContactsPaginationProps) {
  return (
    <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {visibleCount ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of {total} contacts
      </p>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" aria-disabled={page <= 1}>
          <Link href={pageHref(params, Math.max(1, page - 1))}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
        <span className="min-w-20 text-center text-xs font-semibold">Page {page} of {pageCount}</span>
        <Button asChild size="sm" variant="outline" aria-disabled={page >= pageCount}>
          <Link href={pageHref(params, Math.min(pageCount, page + 1))}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
