import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OwnerInvitationRow, OwnerPaginatedResult, OwnerPaginationParams } from "./types";
import { normalizeOwnerPage, normalizeOwnerPageSize, ownerPageResult } from "./pagination";

export async function getOwnerInvitationRows() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_invitation_rows");

  if (error) {
    notFound();
  }

  return (data ?? []) as OwnerInvitationRow[];
}

export async function getOwnerInvitationsPage(
  params: OwnerPaginationParams = {}
): Promise<OwnerPaginatedResult<OwnerInvitationRow>> {
  const page = normalizeOwnerPage(params.page);
  const pageSize = normalizeOwnerPageSize(params.pageSize);
  const q = params.q?.trim().toLowerCase();

  const rows = await getOwnerInvitationRows();

  const filtered = q
    ? rows.filter((invitation) => {
        const haystack = [
          invitation.church_name,
          invitation.display_name,
          invitation.email,
          invitation.role,
          invitation.status,
          invitation.invited_by_name,
          invitation.accepted_by_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
    : rows;

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return ownerPageResult(items, filtered.length, page, pageSize);
}
