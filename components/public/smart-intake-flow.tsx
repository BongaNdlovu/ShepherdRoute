"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { submitIntakeAction } from "@/app/e/[slug]/intake/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IntakeCategory } from "@/lib/intake/intake-categories";

export function SmartIntakeFlow({
  slug,
  categories,
  consentText,
  error
}: {
  slug: string;
  categories: IntakeCategory[];
  consentText: string;
  error?: string;
}) {
  const [step, setStep] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  return (
    <form action={submitIntakeAction} className="grid gap-5 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl">
      {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p> : null}

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="category" value={selectedCategoryId} />
      <input type="hidden" name="answersJson" value={JSON.stringify(answers)} />
      <input type="hidden" name="consentTextSnapshot" value={consentText} />
      <input type="hidden" name="privacyPolicyVersion" value="contact-consent-v1" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{step === 1 ? "Step 1 of 3" : step === 2 ? "Almost done" : "Last step"}</span>
        {step > 1 ? (
          <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="flex items-center gap-1 normal-case tracking-normal text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        ) : null}
      </div>

      {step === 1 ? (
        <div className="grid gap-3">
          <h2 className="text-xl font-bold">What do you need today?</h2>
          <div className="grid gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setAnswers({});
                  setStep(2);
                }}
                className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
              >
                <span className="block text-base font-semibold">{category.label}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{category.description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 && selectedCategory ? (
        <div className="grid gap-4">
          <h2 className="text-xl font-bold">A few quick details</h2>
          {selectedCategory.questions.filter((question) => question.enabled !== false).map((question) => (
            <div key={question.id} className="grid gap-2">
              <Label>{question.label}{question.required ? <span className="text-destructive"> *</span> : null}</Label>
              {question.description ? <p className="text-sm text-muted-foreground">{question.description}</p> : null}

              {question.type === "text" ? (
                <Textarea
                  value={String(answers[question.id] ?? "")}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  placeholder="Type here..."
                />
              ) : (
                <div className="grid gap-2">
                  {question.options?.filter((option) => option.enabled !== false).map((option) => {
                    const isMulti = question.type === "multi_choice";
                    const current = answers[question.id];
                    const checked = isMulti
                      ? Array.isArray(current) && current.includes(option.value)
                      : current === option.value;

                    return (
                      <label key={option.value} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium">
                        <input
                          type={isMulti ? "checkbox" : "radio"}
                          checked={checked}
                          onChange={(event) => {
                            if (isMulti) {
                              const currentValues = Array.isArray(current) ? current.map(String) : [];
                              setAnswer(question.id, event.target.checked
                                ? [...currentValues, option.value]
                                : currentValues.filter((value) => value !== option.value));
                            } else {
                              setAnswer(question.id, option.value);
                            }
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          <Button type="button" size="lg" onClick={() => setStep(3)}>Continue</Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4">
          <h2 className="text-xl font-bold">How can we contact you?</h2>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name <span className="text-destructive">*</span></Label>
            <Input id="fullName" name="fullName" required minLength={2} className="text-base" placeholder="Your full name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">WhatsApp / phone <span className="text-destructive">*</span></Label>
            <Input id="phone" name="phone" required className="text-base" placeholder="+27..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email optional</Label>
            <Input id="email" name="email" type="email" className="text-base" placeholder="you@example.com" />
          </div>
          <input type="hidden" name="preferred_contact_method" value="whatsapp" />
          <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">{consentText}</p>
          <Button type="submit" size="lg" disabled={!selectedCategoryId}>
            <CheckCircle2 className="h-4 w-4" /> Submit request
          </Button>
        </div>
      ) : null}
    </form>
  );
}
