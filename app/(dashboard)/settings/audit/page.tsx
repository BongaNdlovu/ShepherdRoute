import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { getChurchContext } from "@/lib/data";
import { getAuditLogs } from "@/lib/data-audit";

export const metadata = {
  title: "Audit Logs"
};

export default async function AuditLogsPage() {
  const context = await getChurchContext();

  if (!["admin", "pastor"].includes(context.role) && !context.isAppAdmin) {
    notFound();
  }

  const logs = await getAuditLogs(context.churchId);

  return (
    <DashboardShell
      title="Audit logs"
      description="Recent activity and changes in your workspace."
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Last 100 audit log entries</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit logs found.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-sm">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.target_type} {log.target_id ? `(${log.target_id})` : ""}
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {JSON.stringify(log.metadata)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    </DashboardShell>
  );
}
