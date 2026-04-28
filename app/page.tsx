import Link from "next/link";
import { Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Church className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">ShepardRoute</CardTitle>
          <CardDescription>The follow-up pathway for churches that care.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Create an account</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
