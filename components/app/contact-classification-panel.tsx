import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactClassificationPayload } from "@/lib/data";

const tagLabels: Record<string, string> = {
  prayer: "Prayer",
  bible_study: "Bible study",
  health: "Health",
  pastoral_care: "Pastoral care",
  baptism: "Baptism request",
  youth: "Youth",
  family_support: "Family support",
  urgent_follow_up: "Urgent follow-up",
  general_visit: "General visit"
};

const roleLabels: Record<string, string> = {
  pastor: "Pastor",
  elder: "Elder",
  bible_worker: "Bible Worker",
  health_leader: "Health Leader",
  prayer_team: "Prayer Team"
};

type ContactClassificationPanelProps = {
  classification: ContactClassificationPayload | null;
};

export function ContactClassificationPanel({ classification }: ContactClassificationPanelProps) {
  if (!classification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggested routing</CardTitle>
          <CardDescription>No rule-based routing result has been stored for this contact yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Suggested routing</CardTitle>
            <CardDescription className="text-amber-900/75">Rule-based classification for human follow-up.</CardDescription>
          </div>
          <Badge variant={classification.urgency === "high" ? "danger" : classification.urgency === "medium" ? "warning" : "muted"}>
            {classification.urgency} urgency
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          {classification.recommended_tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tagLabels[tag] ?? tag}</Badge>
          ))}
        </div>
        <p className="leading-6 text-amber-950">{classification.summary}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900/70">Recommended role</p>
            <p className="mt-1 font-semibold text-amber-950">{roleLabels[classification.recommended_assigned_role] ?? classification.recommended_assigned_role}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900/70">Next action</p>
            <p className="mt-1 leading-6 text-amber-950">{classification.recommended_next_action}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
