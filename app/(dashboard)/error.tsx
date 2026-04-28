"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
        <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {error.message || "No extra error detail was provided by the server."}
          {error.digest ? <span className="block pt-1 text-xs">Digest: {error.digest}</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/settings/health">Open setup health check</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
