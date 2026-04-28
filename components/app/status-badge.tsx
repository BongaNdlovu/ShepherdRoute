import { Badge } from "@/components/ui/badge";
import { statusLabels, type FollowUpStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: FollowUpStatus }) {
  const variant =
    status === "closed"
      ? "muted"
      : status === "waiting"
        ? "warning"
        : status === "baptism_interest"
          ? "danger"
          : status === "contacted" || status === "attended_church"
            ? "success"
            : "info";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: "low" | "medium" | "high" }) {
  const label = urgency[0].toUpperCase() + urgency.slice(1);
  const variant = urgency === "high" ? "danger" : urgency === "medium" ? "warning" : "muted";
  return <Badge variant={variant}>{label}</Badge>;
}
