import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { OwnerAdminTabs } from "@/components/app/owner-admin-tabs";
import { OwnerPagination } from "@/components/app/owner-pagination";
import { OwnerSearchForm } from "@/components/app/owner-search-form";
import { getOwnerChurchDetail, getOwnerChurchProfilesPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Church Profiles"
};

export default async function OwnerChurchProfilesPage({
  params,
  searchParams
}: {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const { churchId } = await params;
  const paramsQuery = await searchParams;
  const [church, profilesPage] = await Promise.all([
    getOwnerChurchDetail(churchId),
    getOwnerChurchProfilesPage(churchId, paramsQuery)
  ]);

  return (
    <section className="space-y-4">
      <CinematicSection variant="dark" className="cinematic-fade-up">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Owner church view</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-white">{church.name} - Profiles</h2>
      </CinematicSection>

      <OwnerAdminTabs churchId={church.id} active="profiles" />

      <Card>
        <CardHeader>
          <CardTitle>Login memberships</CardTitle>
          <CardDescription>Users with dashboard access to this church.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OwnerSearchForm placeholder="Search profiles..." defaultValue={paramsQuery.q ?? ""} />
          <OwnerPagination
            page={profilesPage.page}
            pageCount={profilesPage.pageCount}
            total={profilesPage.total}
            visibleCount={profilesPage.items.length}
            q={paramsQuery.q}
            pageSize={profilesPage.pageSize}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-semibold">Name</th>
                  <th className="px-4 py-2 text-left font-semibold">Email</th>
                  <th className="px-4 py-2 text-left font-semibold">Phone</th>
                  <th className="px-4 py-2 text-left font-semibold">Role</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">App admin badge</th>
                  <th className="px-4 py-2 text-left font-semibold">Protected owner badge</th>
                  <th className="px-4 py-2 text-left font-semibold">Membership created</th>
                </tr>
              </thead>
              <tbody>
                {profilesPage.items.map((profile) => (
                  <tr key={profile.membership_id} className="border-b">
                    <td className="px-4 py-3 font-semibold">{profile.full_name ?? "-"}</td>
                    <td className="px-4 py-3">{profile.email ?? "-"}</td>
                    <td className="px-4 py-3">{profile.phone ?? "-"}</td>
                    <td className="px-4 py-3">{profile.role}</td>
                    <td className="px-4 py-3">
                      <Badge variant={profile.status === "active" ? "success" : profile.status === "invited" ? "warning" : "destructive"}>
                        {profile.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{profile.app_admin_role ? <Badge variant="warning">{profile.app_admin_role}</Badge> : "-"}</td>
                    <td className="px-4 py-3">{profile.is_protected_owner ? <Badge variant="success">Yes</Badge> : "-"}</td>
                    <td className="px-4 py-3">{new Date(profile.membership_created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!profilesPage.items.length ? (
            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No profiles found.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
