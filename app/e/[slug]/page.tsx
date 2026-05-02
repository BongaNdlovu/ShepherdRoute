import Link from "next/link";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import type { Metadata } from "next";
import { submitRegistrationAction } from "@/app/e/[slug]/actions";
import { BrandLogo } from "@/components/app/brand-logo";
import { ExternalBrandImage } from "@/components/app/external-brand-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import {
  getEffectivePublicInfo,
  getEffectiveBrandingConfig,
  getEffectiveFormConfig,
  replacePlaceholders
} from "@/lib/eventCustomization";
import { prayerVisibilityLabels, prayerVisibilityOptions } from "@/lib/followUp";
import type { CSSProperties } from "react";

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
  const branding = getEffectiveBrandingConfig(event);
  const formConfig = getEffectiveFormConfig(event, template);

  const shouldShowTopic = Boolean(template.topicOptions?.length) && formConfig.show_topic;

  // Replace placeholders in consent text and thank-you message
  const consentText = replacePlaceholders(publicInfo.consent_text, { churchName: event.church_name });
  const thankYouMessage = replacePlaceholders(publicInfo.thank_you_message, { churchName: event.church_name, eventName: event.name || "this event" });

  return (
    <main
      className="min-h-screen px-4 py-6 md:py-10 bg-[radial-gradient(circle_at_top_left,var(--event-primary,#fde68a)_0,var(--event-accent,#f7f3eb)_34%,#f8fafc_100%)]"
      style={
        {
          "--event-primary": branding.primary_color,
          "--event-accent": branding.accent_color
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-white/80 bg-white/95 shadow-xl">
          {branding.cover_image_url ? (
            <ExternalBrandImage
              src={branding.cover_image_url}
              alt={`${event.name} cover`}
              className="h-48 w-full object-cover"
              loading="eager"
            />
          ) : null}
          <CardHeader className="text-center">
            {publicInfo.show_logo && branding.logo_url ? (
              <ExternalBrandImage
                src={branding.logo_url}
                alt={`${event.church_name} logo`}
                className="mx-auto h-24 w-auto object-contain"
              />
            ) : publicInfo.show_logo ? (
              <BrandLogo className="mx-auto h-24 w-auto object-contain" priority />
            ) : null}
            {publicInfo.show_church_name ? (
              <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-amber-700">{event.church_name}</p>
            ) : null}
            <CardTitle className="text-3xl">{publicInfo.heading}</CardTitle>
            <CardDescription>
              {publicInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {query.submitted ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
                <CheckCircle2 className="mx-auto h-12 w-12" />
                <h2 className="mt-4 text-2xl font-black">{publicInfo.thank_you_heading}</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6">
                  {thankYouMessage}
                </p>
              </div>
            ) : (
              <form action={submitRegistrationAction} className="grid gap-5">
                <input type="hidden" name="slug" value={event.slug} />
                <input type="hidden" name="visitorType" value={event.event_type} />
                <input type="hidden" name="templateType" value={event.event_type} />
                <input
                  type="hidden"
                  name="questions"
                  value={JSON.stringify(formConfig.questions)}
                />

                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Your full name"
                    required
                  />
                </div>

                {formConfig.show_phone ? (
                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      Phone / WhatsApp
                      {formConfig.require_phone && <span className="text-rose-600"> *</span>}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+27..."
                      required={formConfig.require_phone}
                    />
                  </div>
                ) : null}

                {formConfig.show_email ? (
                  <div className="grid gap-2">
                    <Label htmlFor="email">
                      Email
                      {formConfig.require_email && <span className="text-rose-600"> *</span>}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required={formConfig.require_email}
                    />
                  </div>
                ) : null}

                {formConfig.show_phone && formConfig.show_email && !formConfig.require_phone && !formConfig.require_email ? (
                  <p className="text-xs text-muted-foreground">
                    If you prefer email only, you may leave Phone / WhatsApp blank and provide your email address.
                  </p>
                ) : null}

                {formConfig.show_language ? (
                  <div className="grid gap-2">
                    <Label htmlFor="language">Preferred language</Label>
                    <select id="language" name="language" defaultValue="English" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                      <option>English</option>
                      <option>isiZulu</option>
                      <option>Afrikaans</option>
                      <option>isiXhosa</option>
                      <option>Sesotho</option>
                    </select>
                  </div>
                ) : null}

                {formConfig.show_best_time ? (
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="bestTimeToContact">Best time to contact</Label>
                    <select id="bestTimeToContact" name="bestTimeToContact" defaultValue="" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                      <option value="">No preference</option>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Weekend</option>
                    </select>
                  </div>
                ) : null}

                {shouldShowTopic ? (
                  <div className="grid gap-2">
                    <Label htmlFor="topic">Seminar topic</Label>
                    <select id="topic" name="topic" defaultValue="" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                      <option value="">Select a topic</option>
                      {template.topicOptions?.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {formConfig.show_interests && formConfig.interest_options.length > 0 && (
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-amber-700" />
                      How can we serve you?
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {formConfig.interest_options.map((option, index) => (
                        <label key={`${option.value}-${index}`} className="flex items-start gap-2 rounded-md border bg-white px-3 py-3 text-sm font-semibold">
                          <input type="checkbox" name="interests" value={option.value} className="mt-0.5 h-4 w-4" />
                          <span>
                            {option.label}
                            {option.description ? <span className="block text-xs font-normal leading-5 text-muted-foreground">{option.description}</span> : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formConfig.questions.length > 0 && (
                  <div className="space-y-4">
                    {formConfig.questions.map((question) => (
                      <div key={question.name} className="grid gap-3 rounded-xl border bg-white/80 p-4 shadow-sm">
                        <Label htmlFor={question.name}>
                          {question.label}
                          {question.required && <span className="text-red-500"> *</span>}
                        </Label>
                        {question.description && (
                          <p className="text-sm text-muted-foreground">{question.description}</p>
                        )}
                        {question.type === "select" && (
                          <select
                            id={question.name}
                            name={question.name}
                            required={question.required}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring"
                          >
                            <option value="">Select an option</option>
                            {question.options.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        )}
                        {question.type === "radio" && (
                          <div className="grid gap-2">
                            {question.options.map((option) => (
                              <label key={option.value} className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-semibold transition hover:bg-amber-50">
                                <input
                                  type="radio"
                                  name={question.name}
                                  value={option.value}
                                  required={question.required}
                                  className="h-4 w-4"
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {question.type === "checkbox_group" && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options.map((option) => (
                              <label key={option.value} className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-semibold transition hover:bg-amber-50">
                                <input
                                  type="checkbox"
                                  name={question.name}
                                  value={option.value}
                                  className="h-4 w-4"
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {formConfig.show_message ? (
                  <div className="grid gap-2">
                    <Label htmlFor="message">Optional message / prayer request</Label>
                    <Textarea id="message" name="message" placeholder="Tell us how we can help..." />
                    <p className="text-xs text-muted-foreground">Prayer requests are stored separately from your general contact details.</p>
                  </div>
                ) : null}

                {formConfig.show_prayer_visibility ? (
                  <div className="grid gap-2">
                    <Label htmlFor="prayerVisibility">Who may view a prayer request?</Label>
                    <select id="prayerVisibility" name="prayerVisibility" defaultValue="general_prayer" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                      {prayerVisibilityOptions.map((visibility) => (
                        <option key={visibility} value={visibility}>{prayerVisibilityLabels[visibility]}</option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <label className="flex items-start gap-3 rounded-lg bg-muted p-4">
                  <input type="checkbox" name="consent" className="mt-1 h-4 w-4" required />
                  <span className="text-sm leading-6 text-slate-600">
                    {consentText}
                  </span>
                </label>
                <Button type="submit" size="lg">Submit visitor form</Button>
                </form>
            )}
          </CardContent>
        </Card>
        <footer className="mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-600 sm:flex-row">
          <span>Copyright (c) {new Date().getFullYear()} ShepherdRoute.</span>
          <Link href="/privacy" className="font-semibold underline-offset-4 hover:underline">Privacy notice</Link>
          <Link href="/copyright" className="font-semibold underline-offset-4 hover:underline">Copyright notice</Link>
        </footer>
      </section>
    </main>
  );
}
