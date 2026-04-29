import { headers } from "next/headers";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export async function requestOrigin() {
  const headersList = await headers();
  const host = firstHeaderValue(headersList.get("x-forwarded-host")) ?? firstHeaderValue(headersList.get("host"));

  if (host) {
    const protocol = firstHeaderValue(headersList.get("x-forwarded-proto")) ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function absoluteRequestUrl(path = "") {
  const origin = await requestOrigin();
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
