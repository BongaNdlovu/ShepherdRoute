export function gmailComposeUrl(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): string {
  const { to, subject, body, cc, bcc } = params;
  const baseUrl = "https://mail.google.com/mail/?view=cm&fs=1";
  const searchParams = new URLSearchParams();
  searchParams.set("to", to);
  searchParams.set("su", subject);
  searchParams.set("body", body);
  if (cc) searchParams.set("cc", cc);
  if (bcc) searchParams.set("bcc", bcc);
  return `${baseUrl}&${searchParams.toString()}`;
}

export function mailtoUrl(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): string {
  const { to, subject, body, cc, bcc } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("subject", subject);
  searchParams.set("body", body);
  if (cc) searchParams.set("cc", cc);
  if (bcc) searchParams.set("bcc", bcc);
  return `mailto:${encodeURIComponent(to)}?${searchParams.toString()}`;
}

export function workspaceInviteTemplate(params: {
  workspaceName: string;
  inviterName: string;
  inviteLink: string;
}): { subject: string; body: string } {
  const { workspaceName, inviterName, inviteLink } = params;
  return {
    subject: `You're invited to join ${workspaceName} on ShepherdRoute`,
    body: `Hi there,

${inviterName} has invited you to join ${workspaceName} on ShepherdRoute.

ShepherdRoute helps churches and ministries manage visitor follow-up, event tracking, and team coordination.

To accept this invitation, click the link below:

${inviteLink}

If you have any questions, feel free to reply to this email.

Thanks,
The ShepherdRoute Team`
  };
}

export function eventInviteTemplate(params: {
  eventName: string;
  workspaceName: string;
  inviterName: string;
  inviteLink: string;
}): { subject: string; body: string } {
  const { eventName, workspaceName, inviterName, inviteLink } = params;
  return {
    subject: `You're invited to help with ${eventName}`,
    body: `Hi there,

${inviterName} has invited you to help with ${eventName} at ${workspaceName} on ShepherdRoute.

ShepherdRoute helps churches and ministries manage visitor follow-up, event tracking, and team coordination.

To accept this invitation, click the link below:

${inviteLink}

If you have any questions, feel free to reply to this email.

Thanks,
The ShepherdRoute Team`
  };
}
