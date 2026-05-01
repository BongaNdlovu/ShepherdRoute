import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type OnboardingStatus = {
  dismissedAt: string | null;
  isNewChurch: boolean;
  needsGuidance: boolean;
};

const NEW_CHURCH_GUIDANCE_DAYS = 14;

function fallbackOnboardingStatus(): OnboardingStatus {
  return {
    dismissedAt: null,
    isNewChurch: false,
    needsGuidance: false
  };
}

export const getOnboardingStatus = cache(async function getOnboardingStatus(
  churchId: string
): Promise<OnboardingStatus> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("churches")
    .select("created_at, onboarding_dismissed_at")
    .eq("id", churchId)
    .single();

  if (error || !data) {
    return fallbackOnboardingStatus();
  }

  const createdAt = data.created_at ? new Date(data.created_at) : null;
  const isRecent = createdAt
    ? createdAt > new Date(Date.now() - NEW_CHURCH_GUIDANCE_DAYS * 24 * 60 * 60 * 1000)
    : false;

  const dismissedAt = data.onboarding_dismissed_at ?? null;

  // Show guidance if not dismissed and either recent church or has data
  const needsGuidance = !dismissedAt && isRecent;

  return {
    dismissedAt,
    isNewChurch: isRecent && !dismissedAt,
    needsGuidance
  };
});
