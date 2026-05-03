import { EventWorkspaceHeader } from "@/components/app/event-workspace-header";

export default async function EventWorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <EventWorkspaceHeader eventId={id} />
      {children}
    </div>
  );
}
