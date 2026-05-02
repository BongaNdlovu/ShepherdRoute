import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getChurchContext, getEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { interestOptions, interestLabels } from "@/lib/constants";
import { updateEventCustomizationAction } from "@/app/(dashboard)/actions";

export default async function EventCustomizePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getChurchContext();
  const event = await getEvent(context.churchId, id);

  if (!event.event) {
    redirect("/events");
  }

  const template = getEventTemplate(event.event.event_type);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Customize form: {event.event.name}</h1>
        <p className="text-muted-foreground">Customize the public form heading, description, and branding for this event.</p>
      </div>

      <form action={updateEventCustomizationAction} className="grid gap-6">
        <input type="hidden" name="eventId" value={event.event.id} />

        {/* Public Info */}
        <Card>
          <CardHeader>
            <CardTitle>Public form text</CardTitle>
            <CardDescription>Customize the heading, description, and messages shown on the public form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="heading">Form heading</Label>
              <Input
                id="heading"
                name="heading"
                placeholder={template.formHeading}
                defaultValue={event.event.public_info?.heading || ""}
                maxLength={120}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Form description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={template.formDescription}
                defaultValue={event.event.public_info?.description || ""}
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thank_you_heading">Thank you heading</Label>
              <Input
                id="thank_you_heading"
                name="thank_you_heading"
                placeholder="Thank you"
                defaultValue={event.event.public_info?.thank_you_heading || ""}
                maxLength={120}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thank_you_message">Thank you message</Label>
              <Textarea
                id="thank_you_message"
                name="thank_you_message"
                placeholder="Your request has been received..."
                defaultValue={event.event.public_info?.thank_you_message || ""}
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="consent_text">Consent text</Label>
              <Textarea
                id="consent_text"
                name="consent_text"
                placeholder="I consent to..."
                defaultValue={event.event.public_info?.consent_text || ""}
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize the logo, colors, and cover image for this event.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                name="logo_url"
                placeholder="https://..."
                defaultValue={event.event.branding_config?.logo_url || ""}
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cover_image_url">Cover image URL</Label>
              <Input
                id="cover_image_url"
                name="cover_image_url"
                placeholder="https://..."
                defaultValue={event.event.branding_config?.cover_image_url || ""}
                maxLength={500}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="primary_color">Primary color</Label>
                <Input
                  id="primary_color"
                  name="primary_color"
                  type="color"
                  defaultValue={event.event.branding_config?.primary_color || "#92400e"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accent_color">Accent color</Label>
                <Input
                  id="accent_color"
                  name="accent_color"
                  type="color"
                  defaultValue={event.event.branding_config?.accent_color || "#f59e0b"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Config */}
        <Card>
          <CardHeader>
            <CardTitle>Form fields</CardTitle>
            <CardDescription>Choose which optional fields to show on the public form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_email"
                defaultChecked={event.event.form_config?.show_email !== false}
              />
              <span>Show email field</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_area"
                defaultChecked={event.event.form_config?.show_area !== false}
              />
              <span>Show area/suburb field</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_language"
                defaultChecked={event.event.form_config?.show_language !== false}
              />
              <span>Show language field</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_best_time"
                defaultChecked={event.event.form_config?.show_best_time !== false}
              />
              <span>Show best time to contact</span>
            </label>
            {template.topicOptions?.length ? (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="show_topic"
                  defaultChecked={event.event.form_config?.show_topic !== false}
                />
                <span>Show topic field</span>
              </label>
            ) : null}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_message"
                defaultChecked={event.event.form_config?.show_message !== false}
              />
              <span>Show message field</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_prayer_visibility"
                defaultChecked={event.event.form_config?.show_prayer_visibility !== false}
              />
              <span>Show prayer visibility field</span>
            </label>
          </CardContent>
        </Card>

        {/* Interest Options */}
        <Card>
          <CardHeader>
            <CardTitle>Interest options</CardTitle>
            <CardDescription>Customize the labels and descriptions for interest checkboxes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {interestOptions.map((interest) => {
              const customOption = event.event.form_config?.interest_options?.find(
                (opt: { value: string }) => opt.value === interest
              );
              return (
                <div key={interest} className="grid gap-2 rounded-lg border p-4">
                  <p className="font-semibold">{interestLabels[interest]}</p>
                  <div className="grid gap-2">
                    <Label htmlFor={`label_${interest}`}>Custom label</Label>
                    <Input
                      id={`label_${interest}`}
                      name={`label_${interest}`}
                      defaultValue={customOption?.label || interestLabels[interest]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`desc_${interest}`}>Custom description</Label>
                    <Input
                      id={`desc_${interest}`}
                      name={`desc_${interest}`}
                      defaultValue={customOption?.description || ""}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Template Questions Preview */}
        {template.questions && template.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Template questions (read-only)</CardTitle>
              <CardDescription>These questions are defined by the event template and will appear on the public form.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {template.questions.map((question) => (
                <div key={question.name} className="grid gap-2 rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{question.label}</p>
                    {question.required && <span className="text-xs text-red-500 font-medium">(required)</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">Type: {question.type}</p>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium">Options:</p>
                    {question.options.map((option) => (
                      <p key={option.value} className="text-xs text-muted-foreground ml-2">
                        - {option.label} ({option.value})
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button type="submit" size="lg">Save customization</Button>
      </form>
    </section>
  );
}
