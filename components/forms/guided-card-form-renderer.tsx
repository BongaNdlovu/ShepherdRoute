"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { submitRegistrationAction } from "@/app/e/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactMethodLabels, type ContactMethod } from "@/lib/constants";
import type { EventFormConfig } from "@/lib/eventCustomization";
import type { EventTemplateConfig, TemplateQuestionField } from "@/lib/eventTemplates";
import { getGuidedPreset } from "@/lib/guided-forms/presets";
import { prayerVisibilityLabels, prayerVisibilityOptions } from "@/lib/followUp";

type GuidedCardFormRendererProps = {
  slug: string;
  eventType: string;
  template: EventTemplateConfig;
  formConfig: EventFormConfig;
  consentText: string;
  availableContactMethods: ContactMethod[];
  shouldShowTopic: boolean;
  error?: string;
};

type GuidedField = {
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  kind: "text" | "email" | "phone" | "select" | "single_choice" | "multi_choice" | "textarea" | "contact_methods";
  name: string;
  options?: Array<{ value: string; label: string }>;
};

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function visibleQuestions(formConfig: EventFormConfig): TemplateQuestionField[] {
  const preset = getGuidedPreset(formConfig.guided_preset);
  return preset?.questions?.length ? preset.questions : formConfig.questions;
}

function visibleInterestOptions(formConfig: EventFormConfig) {
  const preset = getGuidedPreset(formConfig.guided_preset);
  return preset?.interestOptions?.length ? preset.interestOptions : formConfig.interest_options;
}

export function GuidedCardFormRenderer({
  slug,
  eventType,
  template,
  formConfig,
  consentText,
  availableContactMethods,
  shouldShowTopic,
  error
}: GuidedCardFormRendererProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [isLeavingStep, setIsLeavingStep] = useState(false);

  const fields = useMemo<GuidedField[]>(() => {
    const result: GuidedField[] = [];

    result.push({ key: "fullName", name: "fullName", label: "What is your name?", kind: "text", required: true });

    if (formConfig.show_phone) {
      result.push({ key: "phone", name: "phone", label: "What is your WhatsApp or phone number?", kind: "phone", required: formConfig.require_phone });
    }

    if (formConfig.show_email) {
      result.push({ key: "email", name: "email", label: "What is your email address?", kind: "email", required: formConfig.require_email });
    }

    if (formConfig.show_area) {
      result.push({ key: "area", name: "area", label: "Which area or suburb are you from?", kind: "text" });
    }

    if (formConfig.show_language) {
      result.push({
        key: "language",
        name: "language",
        label: "Preferred language",
        kind: "select",
        options: ["English", "isiZulu", "Afrikaans", "isiXhosa", "Sesotho"].map((value) => ({ value, label: value }))
      });
    }

    if (formConfig.show_best_time) {
      result.push({
        key: "bestTimeToContact",
        name: "bestTimeToContact",
        label: "Best time to contact you?",
        kind: "select",
        options: [
          { value: "Morning", label: "Morning" },
          { value: "Afternoon", label: "Afternoon" },
          { value: "Evening", label: "Evening" },
          { value: "Weekend", label: "Weekend" }
        ]
      });
    }

    if (shouldShowTopic && template.topicOptions?.length) {
      result.push({
        key: "topic",
        name: "topic",
        label: "Which topic best describes your request?",
        kind: "select",
        required: true,
        options: template.topicOptions.map((topic) => ({ value: topic, label: topic }))
      });
    }

    const interests = visibleInterestOptions(formConfig);
    if (formConfig.show_interests && interests.length > 0) {
      result.push({
        key: "interests",
        name: "interests",
        label: "How can we serve you today?",
        description: "Choose one or more options.",
        kind: "multi_choice",
        required: false,
        options: interests.map((interest) => ({ value: interest.value, label: interest.label }))
      });
    }

    for (const question of visibleQuestions(formConfig)) {
      result.push({
        key: question.name,
        name: question.name,
        label: question.label,
        description: question.description,
        required: question.required,
        kind: question.type === "checkbox_group" ? "multi_choice" : question.type === "radio" ? "single_choice" : "select",
        options: question.options.map((option) => ({ value: option.value, label: option.label }))
      });
    }

    if (formConfig.show_message) {
      result.push({ key: "message", name: "message", label: "Anything you would like us to know?", kind: "textarea" });
    }

    if (formConfig.show_prayer_visibility) {
      result.push({
        key: "prayerVisibility",
        name: "prayerVisibility",
        label: "Who may view a prayer request?",
        kind: "select",
        options: prayerVisibilityOptions.map((visibility) => ({ value: visibility, label: prayerVisibilityLabels[visibility] }))
      });
    }

    result.push({
      key: "preferred_contact_methods",
      name: "preferred_contact_methods",
      label: "How should we contact you?",
      description: "Choose at least one method.",
      kind: "contact_methods",
      required: true,
      options: availableContactMethods.map((method) => ({ value: method, label: contactMethodLabels[method] }))
    });

    return result;
  }, [availableContactMethods, formConfig, shouldShowTopic, template.topicOptions]);

  const current = fields[step];
  const progress = fields.length ? Math.round(((step + 1) / fields.length) * 100) : 100;

  function setAnswer(key: string, value: unknown) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [key]: value }));
    setStepError(null);
  }

  function validateCurrentStep() {
    if (!current) return true;

    const value = answers[current.key];
    if (current.required && !hasValue(value)) {
      setStepError("Please answer this question before continuing.");
      return false;
    }

    if (current.name === "email" && hasValue(value) && !String(value).includes("@")) {
      setStepError("Please enter a valid email address.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (isLeavingStep) return;
    if (!validateCurrentStep()) return;
    if (step >= fields.length - 1) return;
    setIsLeavingStep(true);
    window.setTimeout(() => {
      setStep((currentStep) => Math.min(fields.length - 1, currentStep + 1));
      setIsLeavingStep(false);
    }, 320);
  }

  function chooseSingleOption(key: string, value: string) {
    if (isLeavingStep) return;
    setAnswer(key, value);
    if (step < fields.length - 1) {
      setIsLeavingStep(true);
      window.setTimeout(() => {
        setStep((currentStep) => Math.min(fields.length - 1, currentStep + 1));
        setIsLeavingStep(false);
      }, 320);
    }
  }

  function renderField(field: GuidedField) {
    const value = answers[field.key];

    if (field.kind === "text" || field.kind === "phone" || field.kind === "email") {
      return (
        <Input
          name={field.name}
          type={field.kind === "email" ? "email" : "text"}
          value={String(value ?? "")}
          onChange={(event) => setAnswer(field.key, event.target.value)}
          required={field.required}
          className="text-base"
          placeholder={field.kind === "phone" ? "+27..." : "Type your answer"}
        />
      );
    }

    if (field.kind === "textarea") {
      return (
        <Textarea
          name={field.name}
          value={String(value ?? "")}
          onChange={(event) => setAnswer(field.key, event.target.value)}
          className="text-base"
          placeholder="Type here..."
        />
      );
    }

    if (field.kind === "select" || field.kind === "single_choice") {
      return (
        <div className="grid gap-2">
          {field.options?.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseSingleOption(field.key, option.value)}
                className={`public-form-option-motion rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "bg-white hover:bg-accent/5"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        {field.options?.map((option) => {
          const selectedValues = Array.isArray(value) ? value.map(String) : [];
          const selected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setAnswer(
                  field.key,
                  selected
                    ? selectedValues.filter((item) => item !== option.value)
                    : [...selectedValues, option.value]
                );
              }}
              className={`public-form-option-motion rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "bg-white hover:bg-accent/5"}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <form action={submitRegistrationAction} className="mobile-safe-container grid gap-5">
      {error ? (
        <div className="mobile-safe-text rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="visitorType" value={eventType} />
      <input type="hidden" name="templateType" value={eventType} />
      <input type="hidden" name="consentTextSnapshot" value={consentText} />
      <input type="hidden" name="privacyPolicyVersion" value="contact-consent-v1" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {fields.map((field) => {
        const value = answers[field.key];
        if (!hasValue(value)) return null;
        if (Array.isArray(value)) {
          return value.map((item) => <input key={`${field.name}-${item}`} type="hidden" name={field.name} value={String(item)} />);
        }
        if (field.kind === "contact_methods" && Array.isArray(value)) {
          return value.map((item) => <input key={`${field.name}-${item}`} type="hidden" name={field.name} value={String(item)} />);
        }
        return <input key={field.name} type="hidden" name={field.name} value={String(value)} />;
      })}

      <div className={`public-form-card-enter rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl ${isLeavingStep ? "public-form-step-exit-left" : ""}`}>
        <div className="mb-5 grid gap-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Question {Math.min(step + 1, fields.length)} of {fields.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {current ? (
          <div key={current.key} className="public-form-step-enter grid gap-4">
            <div>
              <Label className="text-xl font-bold leading-tight">
                {current.label}{current.required ? <span className="text-destructive"> *</span> : null}
              </Label>
              {current.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.description}</p> : null}
            </div>

            {renderField(current)}

            {stepError ? <p className="text-sm font-medium text-destructive">{stepError}</p> : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              {step < fields.length - 1 ? (
                <Button type="button" onClick={goNext}>Next</Button>
              ) : (
                <Button type="submit" onClick={(event) => {
                  if (!validateCurrentStep()) event.preventDefault();
                }}>
                  <CheckCircle2 className="h-4 w-4" /> Submit form
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">{consentText}</p>
    </form>
  );
}
