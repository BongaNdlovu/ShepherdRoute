"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicFormError() {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Registration form unavailable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This event form could not be loaded. The event may be closed, or the church team may need to check the registration link.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
