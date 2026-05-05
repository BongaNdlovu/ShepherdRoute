import { OwnerWorkspaceListPage } from "@/components/app/owner-workspace-list-page";
import { getOwnerMinistriesPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Ministries"
};

export default async function OwnerMinistriesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const params = await searchParams;
  const ministriesPage = await getOwnerMinistriesPage(params);

  return (
    <OwnerWorkspaceListPage
      params={params}
      page={ministriesPage}
      workspaceLabel="Ministry"
      workspaceLabelPlural="Ministries"
      routeBase="/admin/ministries"
      heroDescription="Manage ministry workspaces, teams, profiles, events, contacts, and workspace status."
    />
  );
}
