import type { FollowUpChannel, FollowUpStatus, Interest } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const followUpDueStates = ["open_due", "overdue", "due_today", "upcoming", "completed", "all"] as const;
export type FollowUpDueState = (typeof followUpDueStates)[number];

export type FollowUpQueueFilters = {
  q?: string;
  status?: string;
  assignedTo?: string;
  dueState?: string;
  page?: string;
  pageSize?: string;
};

export type FollowUpQueueItem = {
  id: string;
  contact_id: string;
  assigned_to: string | null;
  status: FollowUpStatus;
  channel: FollowUpChannel;
  next_action: string | null;
  notes: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  contact: {
    full_name: string;
    phone: string;
    email: string | null;
    area: string | null;
    status: FollowUpStatus;
    urgency: "low" | "medium" | "high";
    do_not_contact: boolean;
    interests: Interest[];
    event_id: string | null;
    event_name: string | null;
  };
  assigned_name: string | null;
  suggested_message: {
    id: string;
    message_text: string;
    wa_link: string | null;
    opened_at: string | null;
  } | null;
  total_count: number;
};

export type FollowUpQueuePageResult = {
  items: FollowUpQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  dueState: FollowUpDueState;
};

type SearchFollowUpRow = Database["public"]["Functions"]["search_follow_ups"]["Returns"][number];

function cleanUuid(value?: string) {
  return value && value !== "all" && value !== "unassigned" ? value : null;
}

function cleanDueState(value?: string): FollowUpDueState {
  return followUpDueStates.includes(value as FollowUpDueState) ? value as FollowUpDueState : "open_due";
}

export async function getFollowUpsPage(churchId: string, filters: FollowUpQueueFilters): Promise<FollowUpQueuePageResult> {
  const supabase = await createClient();
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize ?? 25) || 25));
  const dueState = cleanDueState(filters.dueState);
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("search_follow_ups", {
    p_church_id: churchId,
    p_q: filters.q?.trim() || null,
    p_status: filters.status && filters.status !== "all" ? filters.status : null,
    p_assigned_to: cleanUuid(filters.assignedTo),
    p_unassigned: filters.assignedTo === "unassigned",
    p_due_state: dueState,
    p_limit: pageSize,
    p_offset: offset
  });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row: SearchFollowUpRow) => ({
    id: row.id,
    contact_id: row.contact_id,
    assigned_to: row.assigned_to,
    status: row.status,
    channel: row.channel,
    next_action: row.next_action,
    notes: row.notes,
    due_at: row.due_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    contact: {
      full_name: row.contact_full_name,
      phone: row.contact_phone,
      email: row.contact_email,
      area: row.contact_area,
      status: row.contact_status,
      urgency: row.contact_urgency,
      do_not_contact: row.contact_do_not_contact,
      interests: row.interests ?? [],
      event_id: row.event_id,
      event_name: row.event_name
    },
    assigned_name: row.assigned_name,
    suggested_message: row.suggested_message_id
      ? {
        id: row.suggested_message_id,
        message_text: row.suggested_message_text ?? "",
        wa_link: row.suggested_wa_link,
        opened_at: row.suggested_opened_at
      }
      : null,
    total_count: row.total_count
  })) satisfies FollowUpQueueItem[];
  const total = items[0]?.total_count ?? 0;

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    dueState
  };
}
