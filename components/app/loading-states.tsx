import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <header className="rounded-lg border bg-white p-5 shadow-sm">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-8 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
    </header>
  );
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-4 h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10" />)}
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-lg border p-4 xl:grid-cols-[1.15fr_1fr_1.1fr_1.2fr]">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FormCardSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="grid gap-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="grid gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PublicFormSkeleton() {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardHeader className="items-center">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <Skeleton className="mt-4 h-5 w-48" />
            <Skeleton className="h-8 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="grid gap-4">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-12" />)}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
