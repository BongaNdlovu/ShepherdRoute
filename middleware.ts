import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/contacts/:path*",
    "/events/:path*",
    "/follow-ups/:path*",
    "/profile/:path*",
    "/privacy-requests/:path*",
    "/reports/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/admin/:path*"
  ]
};
