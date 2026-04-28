"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
          <section className="w-full max-w-lg rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-amber-100 p-3 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black">ShepardRoute could not load</h1>
                <p className="text-sm text-muted-foreground">This is usually a configuration, database, or deployment issue.</p>
              </div>
            </div>
            <div className="mt-5 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {error.message || "No extra error detail was provided by the server."}
              {error.digest ? <span className="block pt-1 text-xs">Digest: {error.digest}</span> : null}
            </div>
            <Button onClick={reset} className="mt-5">Try again</Button>
          </section>
        </main>
      </body>
    </html>
  );
}
