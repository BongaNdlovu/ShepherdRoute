import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactDetailResult } from "@/lib/data";
import { formatDateTime } from "@/lib/followUp";

type ContactIntakeResponsesPanelProps = {
  intakeResponses: ContactDetailResult["intakeResponses"];
};

function formatLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAnswerValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}

function answerEntries(answers: unknown) {
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) {
    return [];
  }

  return Object.entries(answers).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && String(value).trim().length > 0;
  });
}

export function ContactIntakeResponsesPanel({ intakeResponses }: ContactIntakeResponsesPanelProps) {
  if (!intakeResponses.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Intake Response</CardTitle>
        <CardDescription>Details submitted through the simplified mobile intake flow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {intakeResponses.map((response) => {
          const answers = answerEntries(response.answers);

          return (
            <div key={response.id} className="grid gap-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatLabel(response.category)}</Badge>
                  {response.urgency ? <Badge variant="outline">{formatLabel(response.urgency)} urgency</Badge> : null}
                  {response.preferred_contact_method ? <Badge variant="outline">{formatLabel(response.preferred_contact_method)}</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(response.created_at)}</p>
              </div>

              {answers.length ? (
                <div className="grid gap-2">
                  {answers.map(([key, value]) => (
                    <div key={key} className="rounded-md bg-muted px-3 py-2 text-sm">
                      <p className="font-semibold">{formatLabel(key)}</p>
                      <p className="mt-1 text-muted-foreground">{formatAnswerValue(value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No intake answers were recorded.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
