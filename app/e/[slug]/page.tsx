import Link from "next/link";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import { submitRegistrationAction } from "@/app/e/[slug]/actions";
import { BrandLogo } from "@/components/app/brand-logo";
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
            <img
              src={branding.cover_image_url}
              alt={`${event.name} cover`}
              className="h-48 w-full object-cover"
            />
          ) : null}
          <CardHeader className="text-center">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={`${event.church_name} logo`}
                className="mx-auto h-24 w-auto object-contain"
              />
            ) : (
              <BrandLogo className="mx-auto h-24 w-auto object-contain" priority />
            )}
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-amber-700">{event.church_name}</p>
            <CardTitle className="text-3xl">{publicInfo.heading}</CardTitle>
            <CardDescription>
              {publicInfo.description} {event.name ? `This form is for ${event.name}.` : ""}
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
              <>
                {query.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{query.error}</p> : null}
                <form action={submitRegistrationAction} className="grid gap-5">
                  <input type="hidden" name="slug" value={event.slug} />
                  <input type="hidden" name="visitorType" value={template.type} />
                  <input type="hidden" name="templateType" value={template.type} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Name</Label>
                      <Input id="fullName" name="fullName" placeholder="Your name" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone / WhatsApp</Label>
                      <Input id="phone" name="phone" placeholder="+27..." required />
                    </div>
                    {formConfig.show_email ? (
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="Optional" />
                      </div>
                    ) : null}
                    {formConfig.show_area ? (
                      <div className="grid gap-2">
                        <Label htmlFor="area">Area / suburb</Label>
                        <Input id="area" name="area" placeholder="Pinetown, Kloof, Hillcrest..." />
                      </div>
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
                  </div>

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
              </>
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
