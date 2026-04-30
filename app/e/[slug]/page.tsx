import Link from "next/link";
import { CheckCircle2, Church, HeartHandshake } from "lucide-react";
import { submitRegistrationAction } from "@/app/e/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { prayerVisibilityLabels, prayerVisibilityOptions } from "@/lib/followUp";

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fde68a_0,#f7f3eb_34%,#f8fafc_100%)] px-4 py-6 md:py-10">
      <section className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-white/80 bg-white/95 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-amber-700">{event.church_name}</p>
            <CardTitle className="text-3xl">{template.formHeading}</CardTitle>
            <CardDescription>
              {template.formDescription} {event.name ? `This form is for ${event.name}.` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {query.submitted ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
                <CheckCircle2 className="mx-auto h-12 w-12" />
                <h2 className="mt-4 text-2xl font-black">Thank you</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6">
                  Your request has been received. The {event.church_name} team will follow up with care and respect.
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
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="Optional" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="area">Area / suburb</Label>
                      <Input id="area" name="area" placeholder="Pinetown, Kloof, Hillcrest..." />
                    </div>
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
                  </div>

                  {template.topicOptions?.length ? (
                    <div className="grid gap-2">
                      <Label htmlFor="topic">Seminar topic</Label>
                      <select id="topic" name="topic" defaultValue="" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                        <option value="">Select a topic</option>
                        {template.topicOptions.map((topic) => (
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
                      {template.interestOptions.map((option, index) => (
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

                  <div className="grid gap-2">
                    <Label htmlFor="message">Optional message / prayer request</Label>
                    <Textarea id="message" name="message" placeholder="Tell us how we can help..." />
                    <p className="text-xs text-muted-foreground">Prayer requests are stored separately from your general contact details.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="prayerVisibility">Who may view a prayer request?</Label>
                    <select id="prayerVisibility" name="prayerVisibility" defaultValue="general_prayer" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                      {prayerVisibilityOptions.map((visibility) => (
                        <option key={visibility} value={visibility}>{prayerVisibilityLabels[visibility]}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg bg-muted p-4">
                    <input type="checkbox" name="consent" className="mt-1 h-4 w-4" required />
                    <span className="text-sm leading-6 text-slate-600">
                      I consent to {event.church_name} contacting me about the interests I selected by WhatsApp, phone, or email. I understand I can ask to be removed from follow-up at any time.
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
