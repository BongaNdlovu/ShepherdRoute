import { CheckCircle2, CircleAlert, CircleHelp } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { getChurchContext } from "@/lib/data";
import { getHealthChecks, type HealthStatus } from "@/lib/health";

export const metadata = {
  title: "Setup Health"
};

const statusConfig: Record<HealthStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pass: { label: "Pass", icon: CheckCircle2, className: "text-emerald-700" },
  warn: { label: "Warning", icon: CircleHelp, className: "text-amber-700" },
  fail: { label: "Fix needed", icon: CircleAlert, className: "text-rose-700" }
};

const checklist = [
  "Vercel has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and NEXT_PUBLIC_SITE_URL.",
  "Supabase Auth Site URL is your Vercel production domain.",
  "Supabase Auth Redirect URLs include the production domain and localhost.",
  "The latest supabase/schema.sql has run successfully.",
  "A test signup creates profile, church, membership, and team rows.",
  "Optional: connect Sentry later for client/server error alerts."
];

export default async function SetupHealthPage() {
  const context = await getChurchContext();

  if (!["admin", "pastor"].includes(context.role) && !context.isAppAdmin) {
    notFound();
  }

  const checks = await getHealthChecks(context);
  const failed = checks.filter((check) => check.status === "fail").length;
  const warned = checks.filter((check) => check.status === "warn").length;

  return (
    <DashboardShell
      title="Setup health"
      description="Check configuration and database health for your workspace."
      actions={
        <Badge variant={failed ? "destructive" : warned ? "warning" : "success"}>
          {failed ? `${failed} fix needed` : warned ? `${warned} warning` : "Ready"}
        </Badge>
      }
    >
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader>
                <CardTitle>Environment and database checks</CardTitle>
                <CardDescription>These checks do not expose private keys.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {checks.map((check) => {
                  const config = statusConfig[check.status];
                  const Icon = config.icon;

                  return (
                    <div key={check.name} className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-accent/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Icon className={`mt-0.5 h-5 w-5 ${config.className}`} />
                          <div>
                            <p className="font-semibold text-foreground">{check.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{check.detail}</p>
                          </div>
                        </div>
                        <Badge variant={check.status === "pass" ? "success" : check.status === "warn" ? "warning" : "destructive"}>
                          {config.label}
                        </Badge>
                      </div>
                      {check.status !== "pass" && check.action ? (
                        <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{check.action}</p>
                      ) : null}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Launch checklist</CardTitle>
                  <CardDescription>Keep this page open while configuring Supabase and Vercel.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {checklist.map((item) => (
                    <div key={item} className="flex gap-3 rounded-xl bg-muted/50 p-3 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Observability</CardTitle>
                  <CardDescription>Simple production debugging path for version 1.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Use Vercel Deployments and Function Logs for server errors. Browser errors with a digest can be matched to those logs.</p>
                  <p>Optional next step: add Sentry and set a DSN for real-time client and server alerts.</p>
                  <p className="rounded-xl bg-muted/50 p-3">Repo docs: docs/deployment.md and docs/observability.md.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        </CinematicSection>
      </DashboardShell>
  );
}
