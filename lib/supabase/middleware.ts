import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function sameOriginUrl(request: NextRequest, pathname: string) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const url = new URL(`${request.nextUrl.protocol}//${host}`);
  url.pathname = pathname;
  return url;
}

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (!user && isDashboard) {
    const url = sameOriginUrl(request, "/login");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = sameOriginUrl(request, "/dashboard");
    return NextResponse.redirect(url);
  }

  return response;
}
