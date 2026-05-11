import { redirect } from "next/navigation";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { EventWorkspaceTabs } from "@/components/app/event-workspace-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getChurchContext, getEvent } from "@/lib/data";
import { getEventTemplate } from "@/lib/eventTemplates";
import { interestOptions, interestLabels } from "@/lib/constants";
import { updateEventCustomizationAction } from "@/app/(dashboard)/actions";
import { getDefaultIntakeCategories } from "@/lib/intake/intake-categories";
import { requireCurrentUserEventPermission } from "@/lib/data-event-assignments";

export default async function EventCustomizePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const context = await getChurchContext();

  try {
    await requireCurrentUserEventPermission({
      churchId: context.churchId,
      eventId: id,
      permission: "can_edit_event_settings"
    });
  } catch {
    return (
      <CinematicSection className="cinematic-fade-up">
        <section className="space-y-4">
          <EventWorkspaceTabs eventId={id} permissions={{ can_edit_event_settings: false }} />
          <Card>
            <CardContent className="p-6">
              <h1 className="text-lg font-semibold">Access restricted</h1>
              <p className="text-sm text-muted-foreground">
                You do not have permission to customize this event form.
              </p>
            </CardContent>
          </Card>
        </section>
      </CinematicSection>
    );
  }

  const event = await getEvent(context.churchId, id);

  if (!event.event) {
    redirect("/events");
  }

  const template = getEventTemplate(event.event.event_type);
  const intakeCategories = getDefaultIntakeCategories();

  const displayMode = event.event.form_config?.display_mode === "guided_card" ? "guided_card" : "classic";
  const guidedPreset = typeof event.event.form_config?.guided_preset === "string" ? event.event.form_config.guided_preset : "none";

  return (
    <CinematicSection className="cinematic-fade-up">
      <section className="space-y-6">
        <EventWorkspaceTabs eventId={event.event.id} />

      <div>
        <h1 className="text-2xl font-black">Customize form: {event.event.name}</h1>
        <p className="text-muted-foreground">Customize the public form heading, description, and branding for this event.</p>
      </div>

      {query.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {query.error}
        </div>
      ) : null}
      {query.success ? (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          Event form saved.
        </div>
      ) : null}

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
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_church_name"
                defaultChecked={event.event.public_info?.show_church_name !== false}
              />
              <span>Show church/ministry name on public form</span>
            </label>
            <p className="text-xs text-muted-foreground ml-7">This only hides the name from the public form header. The event is still internally connected to your church/ministry.</p>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_logo"
                defaultChecked={event.event.public_info?.show_logo !== false}
              />
              <span>Show logo on public form</span>
            </label>
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

        {/* Form Display Style */}
        <Card>
          <CardHeader>
            <CardTitle>Form display style</CardTitle>
            <CardDescription>
              Choose how visitors experience the public event form.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="display_mode"
                    value="classic"
                    defaultChecked={displayMode === "classic"}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold">Classic Form</p>
                    <p className="text-sm text-muted-foreground">
                      Shows all public form fields on one page. Best for desktop or detailed entry.
                    </p>
                  </div>
                </div>
              </label>

              <label className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="display_mode"
                    value="guided_card"
                    defaultChecked={displayMode === "guided_card"}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold">Guided Card Form</p>
                    <p className="text-sm text-muted-foreground">
                      Shows one question at a time and works best for mobile visitors.
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="guided_preset">Guided form preset</Label>
              <select
                id="guided_preset"
                name="guided_preset"
                defaultValue={guidedPreset}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="none">Use current event form fields</option>
                <option value="health_expo">Health Expo</option>
                <option value="evangelistic_meeting">Evangelistic Meeting</option>
                <option value="bible_study_interest">Bible Study Interest</option>
                <option value="prayer_request">Prayer Request</option>
                <option value="visitor_follow_up">Visitor Follow-Up</option>
                <option value="youth_event">Youth Event</option>
                <option value="community_outreach">Community Outreach</option>
                <option value="medical_clinic">Medical Clinic</option>
                <option value="family_life_program">Family Life Program</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Presets provide suggested guided-card questions while still submitting through the normal contact workflow.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Config */}
        <Card>
          <CardHeader>
            <CardTitle>Form visibility</CardTitle>
            <CardDescription>Choose which optional fields to show on the public form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="show_phone"
                defaultChecked={event.event.form_config?.show_phone !== false}
              />
              <span>Show phone / WhatsApp field</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="require_phone"
                defaultChecked={event.event.form_config?.require_phone !== false}
              />
              <span>Require phone / WhatsApp</span>
            </label>
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
                name="require_email"
                defaultChecked={event.event.form_config?.require_email !== false}
              />
              <span>Require email</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="require_at_least_one_contact_method"
                defaultChecked={event.event.form_config?.require_at_least_one_contact_method !== false}
              />
              <span>Require at least one contact method</span>
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
                name="show_interests"
                defaultChecked={event.event.form_config?.show_interests !== false}
              />
              <span>Show interest section</span>
            </label>
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
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Required fields</p>
              <p className="text-sm text-amber-700">Name, phone/WhatsApp, and consent are required for reliable follow-up and cannot be hidden yet.</p>
            </div>
          </CardContent>
        </Card>

        {/* Smart Intake */}
        <Card>
          <CardHeader>
            <CardTitle>Smart mobile intake</CardTitle>
            <CardDescription>
              Optional step-based intake for QR visitors. When enabled, QR links can point to /e/[slug]/intake.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="intake_enabled"
                defaultChecked={event.event.form_config?.intake_enabled === true}
              />
              <span>Enable smart intake for this event</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Existing full forms remain available at the normal public form link. Smart intake uses preset categories with editable wording.
            </p>

            <div className="grid gap-4">
              {intakeCategories.map((category) => {
                const customCategory = event.event.form_config?.intake_categories?.find(
                  (candidate: { id: string }) => candidate.id === category.id
                );

                return (
                  <div key={category.id} className="grid gap-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold">{category.label}</p>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`intake_category_enabled_${category.id}`}
                          defaultChecked={customCategory?.enabled !== false}
                        />
                        <span className="text-sm text-muted-foreground">Enable</span>
                      </label>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`intake_category_label_${category.id}`}>Category label</Label>
                      <Input
                        id={`intake_category_label_${category.id}`}
                        name={`intake_category_label_${category.id}`}
                        defaultValue={customCategory?.label || category.label}
                        maxLength={80}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`intake_category_description_${category.id}`}>Category description</Label>
                      <Input
                        id={`intake_category_description_${category.id}`}
                        name={`intake_category_description_${category.id}`}
                        defaultValue={customCategory?.description || category.description}
                        maxLength={160}
                      />
                    </div>

                    <div className="grid gap-3">
                      <p className="text-sm font-medium">Questions</p>
                      {category.questions.map((question) => {
                        const customQuestion = customCategory?.questions?.find(
                          (candidate: { id: string }) => candidate.id === question.id
                        );

                        return (
                          <div key={question.id} className="grid gap-3 rounded-md border p-3">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-semibold">{question.label}</p>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name={`intake_question_enabled_${category.id}_${question.id}`}
                                  defaultChecked={customQuestion?.enabled !== false}
                                />
                                <span className="text-xs text-muted-foreground">Show</span>
                              </label>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`intake_question_label_${category.id}_${question.id}`}>Question label</Label>
                              <Input
                                id={`intake_question_label_${category.id}_${question.id}`}
                                name={`intake_question_label_${category.id}_${question.id}`}
                                defaultValue={customQuestion?.label || question.label}
                                maxLength={140}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`intake_question_description_${category.id}_${question.id}`}>Question description</Label>
                              <Input
                                id={`intake_question_description_${category.id}_${question.id}`}
                                name={`intake_question_description_${category.id}_${question.id}`}
                                defaultValue={customQuestion?.description || question.description || ""}
                                maxLength={180}
                              />
                            </div>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                name={`intake_question_required_${category.id}_${question.id}`}
                                defaultChecked={customQuestion?.required ?? question.required}
                              />
                              <span className="text-sm">Required</span>
                            </label>

                            {question.options?.length ? (
                              <div className="grid gap-2">
                                <p className="text-sm font-medium">Options</p>
                                {question.options.map((option) => {
                                  const customOption = customQuestion?.options?.find(
                                    (candidate: { value: string }) => candidate.value === option.value
                                  );

                                  return (
                                    <div key={option.value} className="grid gap-2 rounded border p-2">
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          name={`intake_option_enabled_${category.id}_${question.id}_${option.value}`}
                                          defaultChecked={customOption?.enabled !== false}
                                        />
                                        <span className="text-xs text-muted-foreground">Show option</span>
                                      </label>
                                      <Input
                                        name={`intake_option_label_${category.id}_${question.id}_${option.value}`}
                                        defaultValue={customOption?.label || option.label}
                                        className="h-8"
                                        maxLength={100}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{interestLabels[interest]}</p>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={`enabled_${interest}`}
                        defaultChecked={customOption?.enabled !== false}
                      />
                      <span className="text-sm text-muted-foreground">Show this option on the public form</span>
                    </label>
                  </div>
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

        {/* Template Questions */}
        {template.questions && template.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Template questions</CardTitle>
              <CardDescription>Customize which questions appear on the public form and their options.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {template.questions.map((question) => {
                const customQuestion = event.event.form_config?.questions?.find(
                  (q: { name: string }) => q.name === question.name
                );
                return (
                  <div key={question.name} className="grid gap-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{question.label}</p>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`question_enabled_${question.name}`}
                          defaultChecked={customQuestion?.enabled !== false}
                        />
                        <span className="text-sm text-muted-foreground">Show this question on the public form</span>
                      </label>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`question_label_${question.name}`}>Question label</Label>
                      <Input
                        id={`question_label_${question.name}`}
                        name={`question_label_${question.name}`}
                        defaultValue={customQuestion?.label || question.label}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`question_description_${question.name}`}>Description (optional)</Label>
                      <Textarea
                        id={`question_description_${question.name}`}
                        name={`question_description_${question.name}`}
                        defaultValue={customQuestion?.description || question.description || ""}
                        placeholder="Optional description"
                        rows={2}
                      />
                    </div>
                    {(question.type === "radio" || question.type === "select") && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`question_required_${question.name}`}
                          defaultChecked={customQuestion?.required ?? question.required}
                        />
                        <span className="text-sm">Required</span>
                      </label>
                    )}
                    <div className="grid gap-3">
                      <p className="text-sm font-medium">Options</p>
                      {question.options.map((option) => {
                        const customOption = customQuestion?.options?.find(
                          (o: { value: string }) => o.value === option.value
                        );
                        return (
                          <div key={option.value} className="grid gap-2 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{option.label}</p>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name={`question_option_enabled_${question.name}_${option.value}`}
                                  defaultChecked={customOption?.enabled !== false}
                                />
                                <span className="text-xs text-muted-foreground">Show this option</span>
                              </label>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`question_option_label_${question.name}_${option.value}`}>Option label</Label>
                              <Input
                                id={`question_option_label_${question.name}_${option.value}`}
                                name={`question_option_label_${question.name}_${option.value}`}
                                defaultValue={customOption?.label || option.label}
                                className="h-8"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Button type="submit" size="lg">Save customization</Button>
      </form>
      </section>
    </CinematicSection>
  );
}
