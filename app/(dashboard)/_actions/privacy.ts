"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const createDataRequestSchema = z.object({
  relatedContactId: z.string().uuid().optional(),
  requestType: z.enum(["correction", "deletion", "export", "restriction"]),
  requesterName: z.string().min(2).max(140),
  requesterContact: z.string().max(200).optional(),
  notes: z.string().max(1000).optional()
});

const updateDataRequestStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["open", "in_review", "completed", "declined"]),
  notes: z.string().max(1000).optional()
});

async function canManagePrivacy(context: { role: string; isAppAdmin: boolean }): Promise<boolean> {
  // Privacy management allowed for admin, pastor, and app admins
  if (context.role === "admin" || context.role === "pastor") {
    return true;
  }
  if (context.isAppAdmin) {
    return true;
  }
  return false;
}

export async function createDataRequestAction(formData: FormData) {
  const context = await getChurchContext();

  if (!(await canManagePrivacy(context))) {
    redirect("/privacy?error=Only%20admins%20and%20pastors%20can%20create%20data%20requests.");
  }

  const parsed = createDataRequestSchema.safeParse({
    relatedContactId: formData.get("relatedContactId") || undefined,
    requestType: formData.get("requestType"),
    requesterName: formData.get("requesterName"),
    requesterContact: formData.get("requesterContact") || undefined,
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) {
    redirect("/privacy?error=Invalid%20input.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("data_requests").insert({
    church_id: context.churchId,
    related_contact_id: parsed.data.relatedContactId || null,
    request_type: parsed.data.requestType,
    requester_name: parsed.data.requesterName,
    requester_contact: parsed.data.requesterContact || null,
    status: "open",
    notes: parsed.data.notes || null,
    created_by: context.userId
  });

  if (error) {
    redirect(`/privacy?error=${encodeURIComponent(error.message)}`);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "data_request",
    target_id: null,
    action: "create",
    metadata: {
      request_type: parsed.data.requestType,
      requester_name: parsed.data.requesterName
    }
  });

  revalidatePath("/privacy");
  redirect("/privacy?success=true");
}

export async function updateDataRequestStatusAction(formData: FormData) {
  const context = await getChurchContext();

  if (!(await canManagePrivacy(context))) {
    redirect("/privacy?error=Only%20admins%20and%20pastors%20can%20update%20data%20requests.");
  }

  const parsed = updateDataRequestStatusSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined
  });

  if (!parsed.success) {
    redirect("/privacy?error=Invalid%20input.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("data_requests")
    .update({
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      resolved_by: context.userId,
      resolved_at: parsed.data.status === "completed" || parsed.data.status === "declined" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.requestId);

  if (error) {
    redirect(`/privacy?error=${encodeURIComponent(error.message)}`);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    church_id: context.churchId,
    actor_user_id: context.userId,
    target_type: "data_request",
    target_id: parsed.data.requestId,
    action: "update_status",
    metadata: {
      status: parsed.data.status
    }
  });

  revalidatePath("/privacy");
  redirect("/privacy?success=true");
}
