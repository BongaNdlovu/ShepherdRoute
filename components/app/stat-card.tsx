import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  title,
  value,
  note
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  note: string;
}) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
