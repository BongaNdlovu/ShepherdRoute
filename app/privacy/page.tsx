import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";

export const metadata = {
  title: "Privacy Notice"
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <CinematicSection>
        <section className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-[0.18em]">ShepherdRoute</span>
            </div>
            <CardTitle>Privacy notice</CardTitle>
            <CardDescription>Minimum app privacy requirements for churches using ShepherdRoute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-6 text-slate-700">
            <p className="text-xs text-muted-foreground">
              Privacy notice version: v1.0 | Last updated: May 2026
            </p>

            <div>
              <h2 className="font-bold text-slate-950">What ShepherdRoute is used for</h2>
              <p className="mt-1">ShepherdRoute helps churches, ministries, and conferences collect visitor/event contact information and manage respectful follow-up.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">What personal information may be collected</h2>
              <p className="mt-1">The app may store name, phone or WhatsApp number, email, area, language preference, event attendance, selected interests, consent source, follow-up status, assigned team member, prayer request text, and routing classifications.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Why the information is collected</h2>
              <p className="mt-1">Information is collected to enable churches to provide the follow-up, care, and ministry support that visitors have consented to receive. The purpose is respectful human connection and spiritual care.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Consent and follow-up</h2>
              <p className="mt-1">Each contact should have consent, consent date, consent source, and agreed communication scope. A person may be marked do not contact, archived, or soft-deleted when they ask to stop receiving follow-up. The app records the exact consent wording accepted at the time of submission.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Prayer request privacy</h2>
              <p className="mt-1">Prayer requests may contain sensitive personal information and should only be viewed by authorized church or ministry leaders. Prayer requests can be marked for prayer team, pastor only, private contact, family support, sensitive, or health-related visibility. Churches should only share prayer details with the roles shown in the app.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Who can access the information</h2>
              <p className="mt-1">Access is restricted to authorized church or ministry team members based on their role (admin, pastor, elder, bible worker, health leader, prayer team, youth leader, or viewer). Each church&apos;s data is isolated from other churches.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">CSV exports and authorized access</h2>
              <p className="mt-1">CSV export of contacts is restricted to admin, pastor, and app admin roles. All exports are logged in the audit trail. Unauthorized users cannot export contact data.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Data retention, archiving, and deletion</h2>
              <p className="mt-1">Contacts may be archived (marked as inactive) or soft-deleted (marked do not contact) when appropriate. Hard deletion may be subject to lawful retention requirements and is tracked in audit logs.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Correction/deletion requests</h2>
              <p className="mt-1">A person may request that their information be corrected, archived, or deleted, subject to lawful retention requirements. Churches can track and manage these requests through the data requests feature.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Human follow-up only</h2>
              <p className="mt-1">The classifier is deterministic routing logic. It does not provide counselling, diagnosis, medical advice, or spiritual judgment. Sensitive cases should be routed to a trusted human leader.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Not medical, counselling, or diagnostic advice</h2>
              <p className="mt-1">ShepherdRoute does not provide medical advice, counselling, diagnosis, or mental health services. Health-related questions are for interest tracking only and do not ask for symptoms or provide medical guidance. All follow-up is human pastoral care.</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Church/ministry responsibility</h2>
              <p className="mt-1">Each church, ministry, or conference using ShepherdRoute remains responsible for its own lawful use of personal information, including compliance with applicable privacy laws (such as POPIA in South Africa).</p>
            </div>

            <div>
              <h2 className="font-bold text-slate-950">Contact placeholder</h2>
              <p className="mt-1">For privacy-related inquiries, contact the responsible church or ministry directly using the contact information provided by that organization.</p>
            </div>

            <p className="rounded-lg bg-muted p-4 text-xs leading-5 text-muted-foreground">
              This notice is not legal advice. Each church, ministry, or conference remains responsible for its own lawful use of personal information.
            </p>

            <Link href="/" className="font-semibold text-amber-700 underline-offset-4 hover:underline">Back to ShepherdRoute</Link>
          </CardContent>
        </Card>
      </section>
      </CinematicSection>
    </main>
  );
}
