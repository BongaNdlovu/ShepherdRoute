import Link from "next/link";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <BrandLogo className="mx-auto mb-3 h-20 w-auto object-contain" priority />
          <CardTitle className="text-2xl">ShepherdRoute</CardTitle>
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
