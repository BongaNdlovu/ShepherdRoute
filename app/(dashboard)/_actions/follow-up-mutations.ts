"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { followUpChannelOptions, statusOptions, assignmentRoleOptions } from "@/lib/constants";
import { getChurchContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { requireActiveTeamMemberInChurch, requireFollowUpAssigner, actionError, safeReturnTo } from "./contact-guards";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";

const followUpNoteSchema = z.object({
  contactId: z.string().uuid(),
  assignedTo: z.string().uuid().or(z.literal("unassigned")),
  assignedHandlingRole: z.enum(assignmentRoleOptions).or(z.literal("")).optional(),
  channel: z.enum(followUpChannelOptions),
  status: z.enum(statusOptions),
  notes: z.string().max(2000).optional(),
  nextAction: z.string().max(500).optional(),
  dueAt: z.string().optional(),
  markComplete: z.literal("on").optional(),
  returnTo: z.string().optional()
});

const markContactedSchema = z.object({
  followUpId: z.string().uuid(),
  contactId: z.string().uuid(),
  returnTo: z.string().optional()
});

const followUpStatusActionSchema = z.object({
  followUpId: z.string().uuid(),
  contactId: z.string().uuid(),
  returnTo: z.string().optional()
});

const escalateOverdueSchema = z.object({
  returnTo: z.string().optional()
});

async function requireFollowUpMutationPermission(params: {
  context: Awaited<ReturnType<typeof getChurchContext>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
  contactId: string;
  returnTo: string;
}) {
  try {
    await requireFollowUpAssigner(params.context, params.supabase, params.returnTo);
    return;
  } catch (error) {
    const { data: contact } = await params.supabase
      .from("contacts")
      .select("event_id")
      .eq("church_id", params.context.churchId)
      .eq("id", params.contactId)
      .maybeSingle();

    if (!contact?.event_id) {
      throw error;
    }

    try {
      await requireCurrentUserEventPermission({
        churchId: params.context.churchId,
        eventId: contact.event_id,
        permission: "can_assign_contacts"
      });
    } catch {
      throw error;
    }
  }
}

export async function addFollowUpNoteAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = followUpNoteSchema.safeParse({
    contactId: formData.get("contactId"),
    assignedTo: formData.get("assignedTo"),
    assignedHandlingRole: formData.has("assignedHandlingRole")
      ? formData.get("assignedHandlingRole") || ""
      : undefined,
    channel: formData.get("channel"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
    nextAction: formData.get("nextAction") || undefined,
    dueAt: formData.get("dueAt") || undefined,
    markComplete: formData.get("markComplete") || undefined,
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    redirect("/contacts?error=Could%20not%20save%20the%20follow-up%20note.");
  }

  const assignedTo = parsed.data.assignedTo === "unassigned" ? null : parsed.data.assignedTo;
  const returnTo = safeReturnTo(parsed.data.returnTo, `/contacts/${parsed.data.contactId}`);
  const assignedHandlingRole =
    parsed.data.assignedHandlingRole === undefined
      ? undefined
      : parsed.data.assignedHandlingRole === ""
        ? null
        : parsed.data.assignedHandlingRole;
  const completedAt = parsed.data.markComplete ? new Date().toISOString() : null;
  const supabase = await createClient();
  await requireFollowUpMutationPermission({ context, supabase, contactId: parsed.data.contactId, returnTo });
  await requireActiveTeamMemberInChurch(supabase, context.churchId, assignedTo, `/contacts/${parsed.data.contactId}`);

  const { data: currentContact } = await supabase
    .from("contacts")
    .select("assigned_handling_role")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId)
    .single();

  const contactCurrentRole = currentContact?.assigned_handling_role ?? null;

  const { error } = await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    assigned_to: assignedTo,
    assigned_handling_role: assignedHandlingRole ?? contactCurrentRole,
    author_id: context.userId,
    channel: parsed.data.channel,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
    next_action: parsed.data.nextAction || null,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
    completed_at: completedAt
  });

  if (error) {
    console.error("Follow-up note creation error:", error);
    redirect(`${returnTo}?error=Could%20not%20save%20the%20follow-up%20note.`);
  }

  const { error: contactUpdateError } = await supabase
    .from("contacts")
    .update({
      assigned_to: assignedTo,
      ...(assignedHandlingRole !== undefined ? { assigned_handling_role: assignedHandlingRole } : {}),
      status: parsed.data.status
    })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  if (contactUpdateError) {
    redirect(`${returnTo}?error=${actionError(contactUpdateError, "Follow-up note saved, but contact status could not be updated.")}`);
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  revalidatePath("/follow-ups");
  redirect(returnTo);
}

export async function markFollowUpContactedAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = markContactedSchema.safeParse({
    followUpId: formData.get("followUpId"),
    contactId: formData.get("contactId"),
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    redirect("/follow-ups?error=Could%20not%20mark%20the%20follow-up%20as%20contacted.");
  }

  const returnTo = safeReturnTo(parsed.data.returnTo, "/follow-ups");
  const supabase = await createClient();
  await requireFollowUpMutationPermission({ context, supabase, contactId: parsed.data.contactId, returnTo });
  const { data: followUp, error: followUpLookupError } = await supabase
    .from("follow_ups")
    .select("id, assigned_to, assigned_handling_role")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.followUpId)
    .eq("contact_id", parsed.data.contactId)
    .is("completed_at", null)
    .maybeSingle();

  if (followUpLookupError || !followUp) {
    redirect(`${returnTo}?error=Open%20follow-up%20task%20not%20found.`);
  }

  const now = new Date().toISOString();
  const { error: followUpError } = await supabase
    .from("follow_ups")
    .update({ status: "contacted", completed_at: now })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.followUpId)
    .eq("contact_id", parsed.data.contactId)
    .is("completed_at", null);

  if (followUpError) {
    redirect(`${returnTo}?error=${actionError(followUpError, "Could not complete the follow-up task.")}`);
  }

  const { error: contactError } = await supabase
    .from("contacts")
    .update({ status: "contacted" })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  if (contactError) {
    redirect(`${returnTo}?error=${actionError(contactError, "Follow-up completed, but contact status could not be updated.")}`);
  }

  const secondTouchDueAt = new Date();
  secondTouchDueAt.setDate(secondTouchDueAt.getDate() + 5);

  const { error: secondTouchError } = await supabase.from("follow_ups").insert({
    church_id: context.churchId,
    contact_id: parsed.data.contactId,
    assigned_to: followUp.assigned_to,
    assigned_handling_role: followUp.assigned_handling_role,
    author_id: context.userId,
    channel: "note",
    status: "assigned",
    notes: "Automatic second touchpoint after initial contact.",
    next_action: "Check in again, confirm whether the prayer or care need has changed, and record the outcome.",
    due_at: secondTouchDueAt.toISOString()
  });

  if (secondTouchError) {
    redirect(`${returnTo}?error=${actionError(secondTouchError, "Follow-up completed, but the second touchpoint reminder could not be created.")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(returnTo);
}

export async function markFollowUpWaitingAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = followUpStatusActionSchema.safeParse({
    followUpId: formData.get("followUpId"),
    contactId: formData.get("contactId"),
    returnTo: formData.get("returnTo") || undefined
  });

  if (!parsed.success) {
    redirect("/follow-ups?error=Could%20not%20update%20the%20follow-up.");
  }

  const returnTo = safeReturnTo(parsed.data.returnTo, "/follow-ups");
  const supabase = await createClient();
  await requireFollowUpMutationPermission({ context, supabase, contactId: parsed.data.contactId, returnTo });

  const { data: followUp, error: followUpLookupError } = await supabase
    .from("follow_ups")
    .select("id")
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.followUpId)
    .eq("contact_id", parsed.data.contactId)
    .is("completed_at", null)
    .maybeSingle();

  if (followUpLookupError || !followUp) {
    redirect(`${returnTo}?error=Open%20follow-up%20task%20not%20found.`);
  }

  const { error: followUpError } = await supabase
    .from("follow_ups")
    .update({
      status: "waiting",
      next_action: "Wait for reply, then record the next follow-up outcome."
    })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.followUpId)
    .eq("contact_id", parsed.data.contactId)
    .is("completed_at", null);

  if (followUpError) {
    redirect(`${returnTo}?error=${actionError(followUpError, "Could not update the follow-up task.")}`);
  }

  const { error: contactError } = await supabase
    .from("contacts")
    .update({ status: "waiting" })
    .eq("church_id", context.churchId)
    .eq("id", parsed.data.contactId);

  if (contactError) {
    redirect(`${returnTo}?error=${actionError(contactError, "Follow-up updated, but contact status could not be updated.")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${parsed.data.contactId}`);
  redirect(returnTo);
}

export async function escalateOverdueFollowUpsAction(formData: FormData) {
  const context = await getChurchContext();
  const parsed = escalateOverdueSchema.safeParse({
    returnTo: formData.get("returnTo") || undefined
  });
  const returnTo = safeReturnTo(parsed.success ? parsed.data.returnTo : undefined, "/follow-ups");
  const supabase = await createClient();

  await requireFollowUpAssigner(context, supabase);

  const { data, error } = await supabase.rpc("escalate_overdue_follow_ups", {
    p_church_id: context.churchId,
    p_limit: 100
  });

  if (error) {
    redirect(`${returnTo}?error=${actionError(error, "Could not escalate overdue follow-ups.")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/contacts");
  redirect(`${returnTo}?success=${encodeURIComponent(`${data ?? 0} overdue follow-up${data === 1 ? "" : "s"} escalated.`)}`);
}
