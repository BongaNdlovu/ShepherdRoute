import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PublicFormLoading() {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardHeader className="items-center">
            <div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
            <div className="mt-4 h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-8 w-72 max-w-full animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="grid gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
