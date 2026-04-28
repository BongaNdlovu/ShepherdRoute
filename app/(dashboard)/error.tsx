"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Something could not load
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          ShepardRoute could not load this workspace view. Check that the Supabase schema has been run, then try again.
        </p>
        <Button onClick={reset} className="mt-4">Try again</Button>
      </CardContent>
    </Card>
  );
}
