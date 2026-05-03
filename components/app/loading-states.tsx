import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent dark:after:via-white/10",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card">
      <ShimmerBlock className="mb-4 h-4 w-32" />
      <ShimmerBlock className="mb-2 h-7 w-24" />
      <ShimmerBlock className="h-4 w-full" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-48 max-w-full" />
              <ShimmerBlock className="h-3 w-72 max-w-full" />
            </div>
            <ShimmerBlock className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <header className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
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
