import { OwnerWorkspaceListPage } from "@/components/app/owner-workspace-list-page";
import { getOwnerChurchesPage } from "@/lib/data";
import { requireOwnerAdmin } from "@/lib/owner-admin";

export const metadata = {
  title: "Owner Churches"
};

export default async function OwnerChurchesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  await requireOwnerAdmin();
  const params = await searchParams;
  const churchesPage = await getOwnerChurchesPage(params);

  return (
    <OwnerWorkspaceListPage
      params={params}
      page={churchesPage}
      workspaceLabel="Church"
      workspaceLabelPlural="Churches"
      routeBase="/admin/churches"
      heroDescription="Search and open church workspaces without loading every contact, event, and profile at once."
    />
  );
}
