import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactNotFound() {
  return (
    <section className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Contact not found</CardTitle>
          <CardDescription>
            This contact could not be found in the current workspace. It may have been deleted, archived, or your account may not have permission to view it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contacts">Back to Contacts</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
