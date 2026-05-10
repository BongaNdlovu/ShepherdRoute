import Link from "next/link";
import { Lightbulb, UsersRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FollowUpSuggestion } from "@/lib/follow-up-suggestions";

export function FollowUpSuggestionCard({
  suggestion,
  canManage
}: {
  suggestion: FollowUpSuggestion;
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Follow-Up Suggestion
        </CardTitle>
        <CardDescription>Recommended next steps based on this contact&apos;s interests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestion.category ? (
          <>
            <div className="grid gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Recommended category:</span>
                <Badge variant="secondary">{suggestion.categoryLabel ?? suggestion.category}</Badge>
              </div>

              {suggestion.team ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Recommended team:</span>
                  <span className="text-sm font-medium">{suggestion.team.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">No matching follow-up team has been configured yet.</span>
                </div>
              )}

              {suggestion.person ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Suggested person:</span>
                  <span className="text-sm font-medium">
                    {suggestion.person.full_name}
                    {suggestion.person.position_title ? ` (${suggestion.person.position_title})` : ""}
                  </span>
                </div>
              ) : null}

              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-muted-foreground shrink-0">Suggested action:</span>
                <span className="text-sm">{suggestion.suggested_action}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-muted-foreground shrink-0">Reason:</span>
                <span className="text-sm text-muted-foreground">{suggestion.reason}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <UsersRound className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No matching follow-up team has been configured yet.
            </p>
          </div>
        )}

        {!suggestion.team && canManage ? (
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/ministry-teams">Create follow-up team</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
