import { notFound } from "next/navigation";
import { Building2, Church, ClipboardList, UsersRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { getChurchContext, getOwnerChurchSummaries } from "@/lib/data";

export const metadata = {
  title: "Owner Admin"
};

export default async function OwnerAdminPage() {
  const context = await getChurchContext();

  if (!context.isAppAdmin) {
    notFound();
  }

  const churches = await getOwnerChurchSummaries();
  const totalEvents = churches.reduce((sum, church) => sum + Number(church.event_count), 0);
  const totalContacts = churches.reduce((sum, church) => sum + Number(church.contact_count), 0);
  const totalTeam = churches.reduce((sum, church) => sum + Number(church.team_count), 0);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-tight">ShepardRoute owner admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">SaaS-level workspace overview without exposing prayer request contents.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Church} title="Churches" value={churches.length} note="Registered church workspaces." />
        <StatCard icon={ClipboardList} title="Events" value={totalEvents} note="Events created across all churches." />
        <StatCard icon={UsersRound} title="Contacts" value={totalContacts} note="Aggregate visitor registrations." />
        <StatCard icon={Building2} title="Team members" value={totalTeam} note="Assignable ministry workers." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Church workspaces</CardTitle>
          <CardDescription>Use this to confirm customers are onboarding correctly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <div className="hidden grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_0.7fr] bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
              <span>Church</span>
              <span>Team</span>
              <span>Events</span>
              <span>Contacts</span>
              <span>New</span>
            </div>
            <div className="divide-y">
              {churches.map((church) => (
                <div key={church.church_id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_0.7fr] md:items-center">
                  <div>
                    <p className="font-bold">{church.church_name}</p>
                    <p className="text-sm text-muted-foreground">Created {new Date(church.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold">{church.team_count}</p>
                  <p className="font-semibold">{church.event_count}</p>
                  <p className="font-semibold">{church.contact_count}</p>
                  <p className="font-semibold">{church.new_contact_count}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
