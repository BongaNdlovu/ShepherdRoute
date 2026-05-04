import Link from "next/link";
import { BarChart3, Bot, LockKeyhole, QrCode, Route, Sparkles, UsersRound } from "lucide-react";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";

const features = [
  {
    icon: QrCode,
    title: "QR-powered event forms",
    description: "Create event forms that visitors can open instantly, with fields that adapt to each ministry moment."
  },
  {
    icon: Route,
    title: "Follow-up routing",
    description: "Turn signups into accountable next steps for pastors, elders, Bible workers, prayer teams, and ministry leaders."
  },
  {
    icon: BarChart3,
    title: "Church and ministry reports",
    description: "See event performance, interests, prayer care, Bible study leads, baptismal requests, and follow-up progress."
  },
  {
    icon: LockKeyhole,
    title: "Privacy-conscious care",
    description: "Keep sensitive care information scoped to the right workspace and handled by trusted people."
  },
  {
    icon: Bot,
    title: "AI report interpretation",
    description: "Use Gemini-powered guidance to interpret detailed reports and decide what should happen next."
  },
  {
    icon: UsersRound,
    title: "Built for real teams",
    description: "Support churches and ministries with role-aware workflows, team assignments, and exportable reporting."
  }
];

const workflow = ["Capture", "Route", "Follow up", "Report"];

export default function HomePage() {
  return (
    <main className="cinematic-shell min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <CinematicSection className="cinematic-fade-up">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-between gap-12">
          <nav className="flex items-center justify-between rounded-3xl surface-card px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
                <BrandLogo className="h-full w-full object-contain" priority />
              </div>
              <div>
                <p className="text-sm font-black leading-tight">ShepherdRoute</p>
                <p className="text-xs text-muted-foreground">Guestloop follow-up platform</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </nav>

          <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950">
                <Sparkles className="h-4 w-4" />
                Event care from first scan to next step
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                  Turn every church event into a clear follow-up pathway.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                  Guestloop helps churches and ministries capture visitors, route care, track accountability, interpret reports, and keep people from falling through the cracks.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/signup">Create an account</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </div>

            <Card className="surface-card overflow-hidden rounded-[2rem] border-white/70">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl">A ministry dashboard that explains what matters</CardTitle>
                <CardDescription>
                  Capture contacts, assign responsibility, and export reports your leadership can act on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-2xl bg-white/70 p-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{step}</p>
                      <p className="text-sm text-muted-foreground">{step === "Capture" ? "QR forms gather visitor and event-specific answers." : step === "Route" ? "Contacts move to the right team members." : step === "Follow up" ? "Teams work through accountable next actions." : "Reports show outcomes and recommended focus."}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="surface-card cinematic-lift rounded-3xl">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-950">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </section>

          <footer className="flex flex-col gap-3 rounded-3xl surface-card p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright (c) {new Date().getFullYear()} ShepherdRoute. All rights reserved.</p>
            <div className="flex gap-3">
              <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy notice</Link>
              <Link href="/copyright" className="font-semibold underline-offset-4 hover:underline">Copyright notice</Link>
            </div>
          </footer>
        </section>
      </CinematicSection>
    </main>
  );
}
