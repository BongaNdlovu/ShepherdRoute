import Link from "next/link";
import { CheckCircle2, Circle, CircleDot, X } from "lucide-react";
import { dismissOnboardingGuideAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

export type OnboardingStep = {
  id: number;
  label: string;
  href: string;
  completed: boolean;
  current: boolean;
};

interface ContextualBannerProps {
  steps: OnboardingStep[];
}

export function ContextualBanner({ steps }: ContextualBannerProps) {
  const currentStep = steps.find((step) => step.current);
  const completedCount = steps.filter((step) => step.completed).length;

  return (
    <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-amber-950">
            Welcome to ShepherdRoute. Complete {completedCount === 0 ? "these steps" : `step ${Math.min(completedCount + 1, steps.length)}`} to get started.
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">
            Set up an event, capture visitors, and make sure every person has a clear follow-up path.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {steps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className={
                  step.completed
                    ? "flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800"
                    : step.current
                      ? "flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-amber-900 shadow-sm ring-1 ring-amber-200"
                      : "flex items-center gap-1.5 rounded-md bg-amber-100/50 px-3 py-1.5 text-sm font-medium text-amber-800/70"
                }
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : step.current ? (
                  <CircleDot className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {step.label}
              </Link>
            ))}
          </div>

          {currentStep ? (
            <p className="mt-3 text-sm text-amber-900/80">
              Next: <span className="font-semibold">{currentStep.label}</span>
            </p>
          ) : null}
        </div>

        <form action={dismissOnboardingGuideAction}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="shrink-0 text-amber-800 hover:bg-amber-100 hover:text-amber-950"
            aria-label="Dismiss onboarding guidance"
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
