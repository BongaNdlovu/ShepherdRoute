"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { friendlyAuthError } from "@/lib/app-errors";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import { getPreferredDashboardPathForUser } from "@/lib/data-profile";
import { normalizeWorkspaceType } from "@/lib/workspace-type";

const optionalInviteTokenSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(20).max(200).optional()
);

const optionalSignupCodeSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional()
);

const optionalEventInviteTokenSchema = optionalInviteTokenSchema;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: optionalInviteTokenSchema,
  eventInviteToken: optionalEventInviteTokenSchema,
  next: z.string().optional()
});

const signupSchema = loginSchema.extend({
  churchName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(2).max(120).optional()
  ),
  workspaceType: z.enum(["church", "ministry"]).default("church"),
  fullName: z.string().min(2).max(120),
  platformSignupCode: optionalSignupCodeSchema,
  eventInviteToken: optionalEventInviteTokenSchema
}).superRefine((value, context) => {
  if (value.inviteToken && value.eventInviteToken) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only one invitation link can be accepted at a time.",
      path: ["inviteToken"]
    });
    return;
  }

  if (value.inviteToken || value.eventInviteToken) {
    return;
  }

  if (!value.churchName) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Church name is required for normal signup.",
      path: ["churchName"]
    });
  }

  if (!hasValidPlatformSignupCode(value.workspaceType, value.platformSignupCode)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The signup code is not correct.",
      path: ["platformSignupCode"]
    });
  }
});

export async function loginAction(formData: FormData) {
  const rawInviteToken = normalizeInviteToken(formData.get("inviteToken"));
  const rawEventInviteToken = normalizeInviteToken(formData.get("eventInviteToken"));
  const rawNext = safeNextPath(formData.get("next"));
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    inviteToken: rawInviteToken,
    eventInviteToken: rawEventInviteToken,
    next: rawNext
  });

  if (!parsed.success) {
    redirect(withAuthInvite("/login?error=Please%20check%20your%20email%20and%20password.", {
      inviteToken: rawInviteToken,
      eventInviteToken: rawEventInviteToken,
      next: rawNext
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(withAuthInvite(`/login?error=${encodeURIComponent(friendlyAuthError(error.message))}`, {
      inviteToken: parsed.data.inviteToken,
      eventInviteToken: parsed.data.eventInviteToken,
      next: parsed.data.next
    }));
  }

  if (parsed.data.inviteToken) {
    const { data: churchId, error: invitationError } = await supabase.rpc("accept_team_invitation", {
      p_token: parsed.data.inviteToken
    });

    if (invitationError || !churchId) {
      redirect(`/invite/${encodeURIComponent(parsed.data.inviteToken)}?error=${encodeURIComponent(invitationError?.message ?? "Could not accept this invitation.")}`);
    }

    await setSelectedChurchCookie(churchId);
  }

  if (parsed.data.eventInviteToken) {
    redirect(parsed.data.next ?? `/event-invitations/accept?token=${encodeURIComponent(parsed.data.eventInviteToken)}`);
  }

  redirect(parsed.data.next ?? await getPreferredDashboardPathForUser(data.user?.id));
}

export async function signupAction(formData: FormData) {
  const rawInviteToken = normalizeInviteToken(formData.get("inviteToken"));
  const rawEventInviteToken = normalizeInviteToken(formData.get("eventInviteToken"));
  const parsed = signupSchema.safeParse({
    churchName: formData.get("churchName"),
    workspaceType: formData.get("workspaceType") || "church",
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteToken: rawInviteToken,
    eventInviteToken: rawEventInviteToken,
    platformSignupCode: formData.get("platformSignupCode")
  });

  if (!parsed.success) {
    redirect(withAuthInvite("/signup?error=Please%20check%20all%20fields%2C%20including%20the%20signup%20code.", {
      inviteToken: rawInviteToken,
      eventInviteToken: rawEventInviteToken
    }));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: absoluteUrl(
        parsed.data.inviteToken
          ? `/invite/${parsed.data.inviteToken}`
          : parsed.data.eventInviteToken
            ? `/event-invitations/accept?token=${parsed.data.eventInviteToken}`
            : "/dashboard"
      ),
      data: {
        full_name: parsed.data.fullName,
        ...(parsed.data.inviteToken
          ? { invite_token: parsed.data.inviteToken }
          : parsed.data.eventInviteToken
            ? { event_invite_token: parsed.data.eventInviteToken }
            : {
                church_name: parsed.data.churchName,
                workspace_type: normalizeWorkspaceType(parsed.data.workspaceType)
              })
      }
    }
  });

  if (error) {
    redirect(withAuthInvite(`/signup?error=${encodeURIComponent(friendlyAuthError(error.message))}`, {
      inviteToken: parsed.data.inviteToken,
      eventInviteToken: parsed.data.eventInviteToken
    }));
  }

  if (parsed.data.inviteToken) {
    redirect(`/invite/${encodeURIComponent(parsed.data.inviteToken)}?signup=check-email`);
  }

  if (parsed.data.eventInviteToken) {
    redirect(`/event-invitations/accept?token=${encodeURIComponent(parsed.data.eventInviteToken)}&signup=check-email`);
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function normalizeInviteToken(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function hasValidPlatformSignupCode(workspaceType: "church" | "ministry", submittedCode: string | undefined) {
  const configuredCode = workspaceType === "ministry"
    ? process.env.SHEPHERDROUTE_MINISTRY_SIGNUP_CODE?.trim()
    : (
        process.env.SHEPHERDROUTE_SIGNUP_CODE?.trim() ||
        process.env.SHEPARDROUTE_SIGNUP_CODE?.trim()
      );

  if (!configuredCode || !submittedCode) {
    return false;
  }

  const submittedBuffer = Buffer.from(submittedCode.trim());
  const configuredBuffer = Buffer.from(configuredCode);

  if (submittedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(submittedBuffer, configuredBuffer);
}

function withInvite(path: string, inviteToken: string | undefined) {
  if (!inviteToken) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}invite=${encodeURIComponent(inviteToken)}`;
}

function withAuthInvite(
  path: string,
  options: {
    inviteToken?: string;
    eventInviteToken?: string;
    next?: string | null;
  }
) {
  let nextPath = withInvite(path, options.inviteToken);
  if (options.eventInviteToken) {
    const separator = nextPath.includes("?") ? "&" : "?";
    nextPath = `${nextPath}${separator}eventInvite=${encodeURIComponent(options.eventInviteToken)}`;
  }
  if (options.next) {
    const separator = nextPath.includes("?") ? "&" : "?";
    nextPath = `${nextPath}${separator}next=${encodeURIComponent(options.next)}`;
  }

  return nextPath;
}

function safeNextPath(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;

  try {
    const url = new URL(value, "http://localhost");
    const allowedPrefixes = [
      "/dashboard",
      "/contacts",
      "/events",
      "/event-invitations/accept",
      "/follow-ups",
      "/profile",
      "/privacy-requests",
      "/reports",
      "/team",
      "/settings",
      "/admin"
    ];

    return allowedPrefixes.some((prefix) => url.pathname.startsWith(prefix))
      ? `${url.pathname}${url.search}${url.hash}`
      : undefined;
  } catch {
    return undefined;
  }
}

async function setSelectedChurchCookie(churchId: string) {
  const cookieStore = await cookies();
  cookieStore.set("selected_church_id", churchId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}
