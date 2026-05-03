import { Badge } from "@/components/ui/badge";
import { statusLabels, type FollowUpStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: FollowUpStatus }) {
  const variant =
    status === "closed"
      ? "muted"
      : status === "waiting"
        ? "warning"
        : status === "baptism_interest"
          ? "destructive"
          : status === "contacted" || status === "attended_church"
            ? "success"
            : "accent";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: "low" | "medium" | "high" }) {
  const label = urgency[0].toUpperCase() + urgency.slice(1);
  const variant = urgency === "high" ? "destructive" : urgency === "medium" ? "warning" : "muted";
  return <Badge variant={variant}>{label}</Badge>;
}
