import { notFound } from "next/navigation";
import { getChurchContext } from "@/lib/data";
import { canManageOwnerAdmin, type AppAdminRole } from "@/lib/permissions";

export async function requireOwnerAdmin() {
  const context = await getChurchContext();

  const canAccess = canManageOwnerAdmin({
    role: context.appAdminRole as AppAdminRole | null,
    isProtectedOwner: context.isProtectedOwner
  });

  if (!context.isAppAdmin || !canAccess) {
    notFound();
  }

  return context;
}
