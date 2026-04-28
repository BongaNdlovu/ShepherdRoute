import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="h-7 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
