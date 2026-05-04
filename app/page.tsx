import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  LockKeyhole,
  QrCode,
  Route,
  Shield,
  Sparkles,
  UsersRound,
  Zap
} from "lucide-react";
import { BrandLogo } from "@/components/app/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: QrCode,
    title: "QR-powered event forms",
    description:
      "Create event forms that visitors can open instantly, with fields that adapt to each ministry moment."
  },
  {
    icon: Route,
    title: "Follow-up routing",
    description:
      "Turn signups into accountable next steps for pastors, elders, Bible workers, prayer teams, and ministry leaders."
  },
  {
    icon: BarChart3,
    title: "Church and ministry reports",
    description:
      "See event performance, interests, prayer care, Bible study leads, baptismal requests, and follow-up progress."
  },
  {
    icon: LockKeyhole,
    title: "Privacy-conscious care",
    description:
      "Keep sensitive care information scoped to the right workspace and handled by trusted people."
  },
  {
    icon: Bot,
    title: "AI report interpretation",
    description:
      "Use Gemini-powered guidance to interpret detailed reports and decide what should happen next."
  },
  {
    icon: UsersRound,
    title: "Built for real teams",
    description:
      "Support churches and ministries with role-aware workflows, team assignments, and exportable reporting."
  }
];

const workflowSteps = [
  {
    number: "01",
    title: "Capture",
    description: "QR forms gather visitor and event-specific answers in seconds.",
    icon: Zap
  },
  {
    number: "02",
    title: "Route",
    description: "Contacts automatically move to the right team members.",
    icon: Route
  },
  {
    number: "03",
    title: "Follow up",
    description: "Teams work through accountable next actions with clear deadlines.",
    icon: CheckCircle2
  },
  {
    number: "04",
    title: "Report",
    description: "Reports show outcomes and recommended focus for leadership.",
    icon: BarChart3
  }
];

const stats = [
  { value: "4", label: "Simple steps", suffix: "" },
  { value: "100", label: "Percent accountable", suffix: "%" },
  { value: "0", label: "People falling through", suffix: "" }
];

export default function HomePage() {
  return (
    <main className="cinematic-shell min-h-screen overflow-hidden no-scrollbar">
      {/* Floating decorative elements */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="floating-element absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="floating-element-delayed absolute right-[12%] top-[25%] h-96 w-96 rounded-full bg-emerald-200/15 blur-3xl" />
        <div className="floating-element absolute bottom-[20%] left-[20%] h-64 w-64 rounded-full bg-indigo-200/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-20 px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between rounded-3xl surface-card px-5 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
              <BrandLogo className="h-full w-full object-contain" priority />
            </div>
            <div>
              <p className="text-sm font-black leading-tight">ShepherdRoute</p>
              <p className="text-xs text-muted-foreground">The follow-up pathway for churches</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-4 py-2 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-bold text-amber-950">Privacy-first visitor care</p>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="grid flex-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-4 py-2 text-sm font-bold text-amber-950 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Event care from first scan to next step
            </div>

            <div className="space-y-6">
              <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl text-shadow-soft">
                Turn every church event into a{" "}
                <span className="hero-text-gradient">clear follow-up pathway.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                ShepherdRoute helps churches and ministries capture visitors, route care, track
                accountability, interpret reports, and keep people from falling through the cracks.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="glow-amber">
                <Link href="/signup">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in to your workspace</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-3xl font-black text-slate-950">
                    {stat.value}
                    <span className="text-amber-600">{stat.suffix}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Preview Card */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-amber-200/30 via-emerald-200/20 to-indigo-200/20 blur-2xl" />
            <Card className="glass-card-strong relative overflow-hidden rounded-[2rem]">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Shield className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-xl">A ministry dashboard that explains what matters</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Capture contacts, assign responsibility, and export reports your leadership can act on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {workflowSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className="group flex items-center gap-4 rounded-2xl bg-white/60 p-4 transition-all hover:bg-white/80 hover:shadow-sm"
                    >
                      <div className="number-badge flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-950">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Icon className="h-5 w-5 text-muted-foreground/50 transition-colors group-hover:text-amber-600" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="space-y-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built for the way churches actually work
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From visitor capture to leadership reporting, every step is designed for real ministry teams.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="glass-card-strong cinematic-lift group overflow-hidden rounded-3xl border-glow"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-950 transition-transform group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] surface-card px-8 py-16 text-center sm:px-12">
          <div className="mesh-gradient-accent absolute inset-0" />
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Ready to stop losing track of visitors?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join churches and ministries using ShepherdRoute to turn every event into a clear follow-up pathway.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="glow-amber">
                <Link href="/signup">
                  Create your workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-3 rounded-3xl surface-card p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright (c) {new Date().getFullYear()} ShepherdRoute. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">
              Privacy notice
            </Link>
            <Link href="/copyright" className="font-semibold underline-offset-4 hover:underline">
              Copyright notice
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
