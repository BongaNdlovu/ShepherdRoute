import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Notice"
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-[0.18em]">ShepherdRoute</span>
            </div>
            <CardTitle>Privacy notice</CardTitle>
            <CardDescription>How churches using ShepherdRoute should handle visitor and member follow-up data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-slate-700">
            <p>
              ShepherdRoute helps a church record contact details, ministry interests, consent, prayer request visibility, follow-up ownership, and event journey history.
              Churches are responsible for using this information only for the follow-up purpose the person agreed to.
            </p>
            <div>
              <h2 className="font-bold text-slate-950">Information collected</h2>
              <p className="mt-1">The app may store name, phone or WhatsApp number, email, area, language preference, event attendance, selected interests, consent source, follow-up status, assigned team member, prayer request text, and routing classifications.</p>
            </div>
            <div>
              <h2 className="font-bold text-slate-950">Prayer request privacy</h2>
              <p className="mt-1">Prayer requests can be marked for prayer team, pastor only, private contact, family support, sensitive, or health-related visibility. Churches should only share prayer details with the roles shown in the app.</p>
            </div>
            <div>
              <h2 className="font-bold text-slate-950">Consent and opt-out</h2>
              <p className="mt-1">Each contact should have consent, consent date, consent source, and agreed communication scope. A person may be marked do not contact, archived, or soft-deleted when they ask to stop receiving follow-up.</p>
            </div>
            <div>
              <h2 className="font-bold text-slate-950">Human follow-up only</h2>
              <p className="mt-1">The classifier is deterministic routing logic. It does not provide counselling, diagnosis, medical advice, or spiritual judgment. Sensitive cases should be routed to a trusted human leader.</p>
            </div>
            <p className="rounded-lg bg-muted p-4 text-xs leading-5 text-muted-foreground">
              This notice is a product notice, not legal advice. Each church should adapt its privacy practices to local law and denominational policy.
            </p>
            <Link href="/" className="font-semibold text-amber-700 underline-offset-4 hover:underline">Back to ShepherdRoute</Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
