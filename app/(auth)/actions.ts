"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyAuthError } from "@/lib/app-errors";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

const optionalInviteTokenSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(20).max(200).optional()
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: optionalInviteTokenSchema
});

const signupSchema = loginSchema.extend({
  churchName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(2).max(120).optional()
  ),
  fullName: z.string().min(2).max(120)
}).superRefine((value, context) => {
  if (!value.inviteToken && !value.churchName) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Church name is required for normal signup.",
      path: ["churchName"]
    });
  }
});

export async function loginAction(formData: FormData) {
  const rawInviteToken = normalizeInviteToken(formData.get("inviteToken"));
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    inviteToken: rawInviteToken
  });

  if (!parsed.success) {
    redirect(withInvite("/login?error=Please%20check%20your%20email%20and%20password.", rawInviteToken));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    redirect(withInvite(`/login?error=${encodeURIComponent(friendlyAuthError(error.message))}`, parsed.data.inviteToken));
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

  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const rawInviteToken = normalizeInviteToken(formData.get("inviteToken"));
  const parsed = signupSchema.safeParse({
    churchName: formData.get("churchName"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteToken: rawInviteToken
  });

  if (!parsed.success) {
    redirect(withInvite("/signup?error=Please%20complete%20all%20fields.", rawInviteToken));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: absoluteUrl(parsed.data.inviteToken ? `/invite/${parsed.data.inviteToken}` : "/dashboard"),
      data: {
        full_name: parsed.data.fullName,
        ...(parsed.data.inviteToken
          ? { invite_token: parsed.data.inviteToken }
          : { church_name: parsed.data.churchName })
      }
    }
  });

  if (error) {
    redirect(withInvite(`/signup?error=${encodeURIComponent(friendlyAuthError(error.message))}`, parsed.data.inviteToken));
  }

  if (parsed.data.inviteToken) {
    redirect(`/invite/${encodeURIComponent(parsed.data.inviteToken)}?signup=check-email`);
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

function withInvite(path: string, inviteToken: string | undefined) {
  if (!inviteToken) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}invite=${encodeURIComponent(inviteToken)}`;
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
