import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Copyright Notice"
};

export default function CopyrightPage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Copyright notice</CardTitle>
            <CardDescription>ShepherdRoute product, workflow, and content notice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-slate-700">
            <p>Copyright (c) {year} ShepherdRoute. All rights reserved unless a separate written license says otherwise.</p>
            <p>
              The ShepherdRoute name, product workflows, interface text, event template wording, routing logic, reports, and documentation are provided for church follow-up operations.
              Churches may use the app for their own ministry follow-up, but may not copy, resell, rebrand, or redistribute the product materials without permission.
            </p>
            <p>
              Churches remain responsible for the data they enter, export, or message through the app, including visitor contact details, consent records, prayer requests, and follow-up notes.
            </p>
            <Link href="/" className="font-semibold text-amber-700 underline-offset-4 hover:underline">Back to ShepherdRoute</Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
