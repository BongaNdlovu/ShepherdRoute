import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { getOwnerChurchDetail, getOwnerChurchTeamPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Church Team"
};

export default async function OwnerChurchTeamPage({
  params,
  searchParams
}: {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const { churchId } = await params;
  const paramsQuery = await searchParams;
  const [church, teamPage] = await Promise.all([
    getOwnerChurchDetail(churchId),
    getOwnerChurchTeamPage(churchId, paramsQuery)
  ]);

  return (
    <section className="space-y-4">
      <CinematicSection variant="dark" className="cinematic-fade-up">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner church view</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-white">{church.name} - Team</h2>
      </CinematicSection>

      <OwnerAdminTabs churchId={church.id} active="team" />

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Assignable ministry workers for this church.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search team..." defaultValue={paramsQuery.q ?? ""} />
          <OwnerPagination
            page={teamPage.page}
            pageCount={teamPage.pageCount}
            total={teamPage.total}
            visibleCount={teamPage.items.length}
            q={paramsQuery.q}
            pageSize={teamPage.pageSize}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Role</th>
                  <th className="px-4 py-2 text-left font-semibold">Email</th>
                  <th className="px-4 py-2 text-left font-semibold">Phone</th>
                  <th className="px-4 py-2 text-left font-semibold">Login access</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {teamPage.items.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="px-4 py-3 font-semibold">{member.display_name}</td>
                    <td className="px-4 py-3">{member.role}</td>
                    <td className="px-4 py-3">{member.email ?? "-"}</td>
                    <td className="px-4 py-3">{member.phone ?? "-"}</td>
                    <td className="px-4 py-3">{member.membership_id ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{member.is_active ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-3">{new Date(member.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!teamPage.items.length ? (
            <p className="rounded-lg bg-white/10 p-4 text-sm text-muted-foreground">No team members found.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
