import Link from "next/link";
import { CheckCircle2, HeartHandshake, AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { submitRegistrationAction } from "@/app/e/[slug]/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { ExternalBrandImage } from "@/components/app/external-brand-image";
import { PendingSubmitButton } from "@/components/app/pending-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContactMethodConsent } from "@/components/forms/contact-method-consent";
import { getPublicEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import {
  getEffectivePublicInfo,
  getEffectiveBrandingConfig,
  getEffectiveFormConfig,
  replacePlaceholders
} from "@/lib/eventCustomization";
import { prayerVisibilityLabels, prayerVisibilityOptions } from "@/lib/followUp";
import { isHealthRelatedEvent } from "@/lib/workspace-type";
import type { CSSProperties } from "react";
import type { ContactMethod } from "@/lib/constants";

function getSafeHttpsUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return null;
    }

    const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

    if (blockedHosts.has(url.hostname)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  const template = getEventTemplate(event.event_type);
  const publicInfo = getEffectivePublicInfo(event, template);
  const branding = getEffectiveBrandingConfig(event);

  const title = publicInfo.show_church_name
    ? `${event.name || publicInfo.heading} | ${event.church_name}`
    : `${event.name || publicInfo.heading}`;
  const description = publicInfo.description || template.formDescription;

  // Determine image URL with priority: cover_image_url > logo_url (if show_logo) > none
  const coverImageUrl = getSafeHttpsUrl(branding.cover_image_url);
  const logoImageUrl = publicInfo.show_logo ? getSafeHttpsUrl(branding.logo_url) : null;
  const imageUrl = coverImageUrl || logoImageUrl;

  const hasImage = !!imageUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: hasImage
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `${event.name} preview image`
            }
          ]
        : []
    },
    twitter: {
      card: hasImage ? "summary_large_image" : "summary",
      title,
      description,
      images: hasImage ? [imageUrl] : []
    }
  };
}

export default async function PublicEventPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const event = await getPublicEvent(slug);
  const template = getEventTemplate(event.event_type);
  const publicInfo = getEffectivePublicInfo(event, template);
  const brandingConfig = getEffectiveBrandingConfig(event);
  const formConfig = getEffectiveFormConfig(event, template);
  const isHealthEvent = isHealthRelatedEvent(event.event_type);

  const availableContactMethods = [
    formConfig.show_phone ? "whatsapp" : null,
    formConfig.show_phone ? "phone" : null,
    formConfig.show_email ? "email" : null
  ].filter(Boolean) as ContactMethod[];

  const shouldShowTopic = Boolean(template.topicOptions?.length) && formConfig.show_topic;

  // Replace placeholders in consent text and thank-you message
  const consentText = replacePlaceholders(publicInfo.consent_text, { churchName: event.church_name });
  const thankYouMessage = replacePlaceholders(publicInfo.thank_you_message, { churchName: event.church_name, eventName: event.name || "this event" });

  return (
    <main
      className="mobile-safe-container min-h-screen py-6 md:py-10 bg-[radial-gradient(circle_at_top_left,var(--event-primary,#fde68a)_0,var(--event-accent,#f7f3eb)_34%,#f8fafc_100%)]"
      style={
        {
          "--event-primary": brandingConfig.primary_color,
          "--event-accent": brandingConfig.accent_color
        } as CSSProperties
      }
    >
      <section className="mobile-safe-container mx-auto max-w-3xl px-5 sm:px-8">
        <div className="mobile-safe-container overflow-hidden rounded-2xl">
          {brandingConfig.cover_image_url ? (
            <ExternalBrandImage
              src={brandingConfig.cover_image_url}
              alt={`${event.name} cover`}
              className="h-48 w-full rounded-2xl object-cover"
              width={1200}
              height={360}
              loading="eager"
              style={{ aspectRatio: "10 / 3" }}
            />
          ) : null}
          <header className="py-6 text-center">
            {publicInfo.show_logo && brandingConfig.logo_url ? (
              <ExternalBrandImage
                src={brandingConfig.logo_url}
                alt={`${event.church_name} logo`}
                className="mx-auto h-24 w-auto object-contain"
                width={192}
                height={96}
                style={{ aspectRatio: "2 / 1" }}
              />
            ) : publicInfo.show_logo ? (
              <BrandLogo className="mx-auto h-24 w-auto object-contain" priority />
            ) : null}
            {publicInfo.show_church_name ? (
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">{event.church_name}</p>
            ) : null}
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-foreground">{publicInfo.heading}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {publicInfo.description}
            </p>
            {isHealthEvent && (
              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  This event provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </div>
            )}
          </header>
          <div className="pb-6">
            {query.submitted ? (
              <div className="rounded-2xl border border-success/20 bg-success/10 p-5 sm:p-6 text-center text-success">
                <CheckCircle2 className="mx-auto h-12 w-12" />
                <h2 className="mt-4 text-2xl font-semibold">{publicInfo.thank_you_heading}</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6">
                  {thankYouMessage}
                </p>
              </div>
            ) : (
              <form action={submitRegistrationAction} className="mobile-safe-container grid gap-5">
                {query.error ? (
                  <div className="mobile-safe-text rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {query.error}
                  </div>
                ) : null}
                <input type="hidden" name="slug" value={event.slug} />
                <input type="hidden" name="visitorType" value={event.event_type} />
                <input type="hidden" name="templateType" value={event.event_type} />

                <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                  <Label htmlFor="fullName" className="mobile-safe-text">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Your full name"
                    required
                    className="mobile-safe-field text-base sm:text-sm"
                  />
                </div>

                {formConfig.show_phone ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="phone" className="mobile-safe-text">
                      Phone / WhatsApp
                      {formConfig.require_phone && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+27..."
                      required={formConfig.require_phone}
                      className="mobile-safe-field text-base sm:text-sm"
                    />
                  </div>
                ) : null}

                {formConfig.show_email ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="email" className="mobile-safe-text">
                      Email
                      {formConfig.require_email && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required={formConfig.require_email}
                      className="mobile-safe-field text-base sm:text-sm"
                    />
                  </div>
                ) : null}

                {formConfig.show_phone && formConfig.show_email && !formConfig.require_phone && !formConfig.require_email ? (
                  <p className="mobile-safe-text text-xs text-muted-foreground">
                    If you prefer email only, you may leave Phone / WhatsApp blank and provide your email address.
                  </p>
                ) : null}

                {formConfig.show_area ? (
                  <div className="mobile-safe-container grid gap-2">
                    <Label htmlFor="area" className="mobile-safe-text">Area / suburb</Label>
                    <Input
                      id="area"
                      name="area"
                      placeholder="Your area or suburb"
                      className="mobile-safe-field"
                    />
                  </div>
                ) : null}

                {formConfig.show_language ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="language" className="mobile-safe-text">Preferred language</Label>
                    <select id="language" name="language" defaultValue="English" className="mobile-safe-field h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option>English</option>
                      <option>isiZulu</option>
                      <option>Afrikaans</option>
                      <option>isiXhosa</option>
                      <option>Sesotho</option>
                    </select>
                  </div>
                ) : null}

                {formConfig.show_best_time ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="bestTimeToContact" className="mobile-safe-text">Best time to contact</Label>
                    <select id="bestTimeToContact" name="bestTimeToContact" defaultValue="" className="mobile-safe-field h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">No preference</option>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Weekend</option>
                    </select>
                  </div>
                ) : null}

                {shouldShowTopic ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="topic" className="mobile-safe-text">Topic</Label>
                    <select id="topic" name="topic" defaultValue="" className="mobile-safe-field h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">Select a topic</option>
                      {template.topicOptions?.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {formConfig.show_interests && formConfig.interest_options.length > 0 && (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label className="mobile-safe-text flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-accent" />
                      How can we serve you?
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {formConfig.interest_options.map((option, index) => (
                        <label key={`${option.value}-${index}`} className="mobile-safe-container flex items-start gap-2 rounded-xl border border-border/70 bg-white px-3 py-3 text-sm font-medium transition hover:bg-accent/5 break-words">
                          <input type="checkbox" name="interests" value={option.value} className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="mobile-safe-text w-full min-w-0">
                            {option.label}
                            {option.description ? <span className="block text-xs font-normal leading-5 text-muted-foreground">{option.description}</span> : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formConfig.questions.length > 0 && (
                  <div className="mobile-safe-container space-y-4">
                    {formConfig.questions.map((question) => (
                      <div key={question.name} className="mobile-safe-container grid gap-3 rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm">
                        <Label htmlFor={question.name} className="mobile-safe-text">
                          {question.label}
                          {question.required && <span className="text-destructive"> *</span>}
                        </Label>
                        {question.description && (
                          <p className="mobile-safe-text text-sm text-muted-foreground">{question.description}</p>
                        )}
                        {question.type === "select" && (
                          <select
                            id={question.name}
                            name={question.name}
                            required={question.required}
                            className="mobile-safe-field h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select an option</option>
                            {question.options.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        )}
                        {question.type === "radio" && (
                          <div className="mobile-safe-container grid gap-2">
                            {question.options.map((option) => (
                              <label key={option.value} className="mobile-safe-container flex items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 text-sm font-medium transition hover:bg-accent/5">
                                <input
                                  type="radio"
                                  name={question.name}
                                  value={option.value}
                                  required={question.required}
                                  className="h-4 w-4"
                                />
                                <span className="mobile-safe-text">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {question.type === "checkbox_group" && (
                          <div className="mobile-safe-container grid gap-2 sm:grid-cols-2">
                            {question.options.map((option) => (
                              <label key={option.value} className="mobile-safe-container flex items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 text-sm font-medium transition hover:bg-accent/5">
                                <input
                                  type="checkbox"
                                  name={question.name}
                                  value={option.value}
                                  className="h-4 w-4"
                                />
                                <span className="mobile-safe-text">{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {formConfig.show_message ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="message" className="mobile-safe-text">Tell us more about what you would like to share with us...</Label>
                    <Textarea id="message" name="message" placeholder="Tell us how we can help..." className="mobile-safe-field text-base sm:text-sm" />
                    <p className="mobile-safe-text text-xs text-muted-foreground">Prayer requests are stored separately from your general contact details.</p>
                  </div>
                ) : null}

                {formConfig.show_prayer_visibility ? (
                  <div className="mobile-safe-container grid gap-2 w-full min-w-0">
                    <Label htmlFor="prayerVisibility" className="mobile-safe-text">Who may view a prayer request?</Label>
                    <select id="prayerVisibility" name="prayerVisibility" defaultValue="general_prayer" className="mobile-safe-field h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {prayerVisibilityOptions.map((visibility) => (
                        <option key={visibility} value={visibility}>{prayerVisibilityLabels[visibility]}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <input type="hidden" name="consentTextSnapshot" value={consentText} />
                <input type="hidden" name="privacyPolicyVersion" value="contact-consent-v1" />
                
                {/* Honeypot field for bot protection */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                
                <ContactMethodConsent availableMethods={availableContactMethods} />
                <PendingSubmitButton size="lg" pendingText="Submitting...">
                  Submit form
                </PendingSubmitButton>
                </form>
            )}
          </div>
        </div>
        <footer className="mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:flex-row">
          <span>Copyright (c) {new Date().getFullYear()} ShepherdRoute.</span>
          <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy notice</Link>
          <Link href="/copyright" className="font-semibold underline-offset-4 hover:underline">Copyright notice</Link>
        </footer>
      </section>
    </main>
  );
}
