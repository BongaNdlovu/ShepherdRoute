import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InactiveWorkspaceNotice({ name, label }: { name: string; label: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-950">
          <AlertTriangle className="h-5 w-5" />
          {label} inactive
        </CardTitle>
        <CardDescription className="text-amber-900/80">
          {name} has been deactivated by the ShepherdRoute owner. This workspace cannot be used until it is reactivated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-amber-900">
          If this is unexpected, contact the ShepherdRoute owner or administrator. Your data has not been deleted; access is temporarily paused.
        </p>
      </CardContent>
    </Card>
  );
}
