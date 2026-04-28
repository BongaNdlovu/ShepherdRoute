export function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid api key") || normalized.includes("api key")) {
    return "Supabase rejected the API key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "The email or password is not correct. Please check it and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }

  if (normalized.includes("fetch failed") || normalized.includes("network")) {
    return "ShepardRoute could not reach Supabase. Check the project URL, API key, and your connection.";
  }

  return message;
}

export function friendlyDataError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("search_contacts") || normalized.includes("function") || normalized.includes("rpc")) {
    return "The Supabase schema is not fully installed. Run the latest supabase/schema.sql in the SQL Editor.";
  }

  if (normalized.includes("permission denied") || normalized.includes("row-level security")) {
    return "Supabase blocked this request. Check Row Level Security policies and church membership setup.";
  }

  if (normalized.includes("invalid api key")) {
    return "Supabase rejected the API key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.";
  }

  return message;
}
