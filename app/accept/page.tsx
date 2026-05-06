import { redirect } from "next/navigation";

export default async function LegacyAcceptInvitePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token.trim() : "";
  const destination = token
    ? `/event-invitations/accept?token=${encodeURIComponent(token)}`
    : "/event-invitations/accept";

  redirect(destination);
}
