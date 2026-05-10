"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PUBLIC_FORM_HOURLY_LIMIT = 50;
const DEFAULT_PUBLIC_FORM_DAILY_LIMIT = 200;

function publicFormLimit(envName: string, fallback: number): number {
  const value = Number.parseInt(process.env[envName] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function hashIP(ip: string, salt: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(`${ip}${salt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const vercelForwarded = headersList.get("x-vercel-forwarded-for");
  const cfConnectingIP = headersList.get("cf-connecting-ip");
  const realIP = headersList.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0].trim();
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export async function reservePublicFormRateLimitSlot(slug: string): Promise<boolean> {
  const ip = await getClientIP();
  const salt =
    process.env.PUBLIC_FORM_RATE_LIMIT_SALT ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VERCEL_URL ||
    "development-rate-limit-salt";

  if (!process.env.PUBLIC_FORM_RATE_LIMIT_SALT && process.env.NODE_ENV === "production") {
    console.warn("PUBLIC_FORM_RATE_LIMIT_SALT is missing in production. Falling back to app-derived public form rate-limit salt.");
  }

  const ipHash = await hashIP(ip, salt);

  const supabase = await createClient();
  const hourlyLimit = publicFormLimit("PUBLIC_FORM_RATE_LIMIT_HOURLY", DEFAULT_PUBLIC_FORM_HOURLY_LIMIT);
  const dailyLimit = publicFormLimit("PUBLIC_FORM_RATE_LIMIT_DAILY", DEFAULT_PUBLIC_FORM_DAILY_LIMIT);

  const { data, error } = await supabase.rpc("reserve_public_form_submission_slot", {
    p_slug: slug,
    p_ip_hash: ipHash,
    p_hourly_limit: hourlyLimit,
    p_daily_limit: dailyLimit
  });

  if (error) {
    console.error("Rate limit reservation error:", error);
    return false;
  }

  return data === true;
}
