import { createEventAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { eventTypeLabels, eventTypeOptions } from "@/lib/constants";
import { eventTemplateOptions } from "@/lib/eventTemplates";

export const metadata = {
  title: "Create Event"
};

export default async function NewEventPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create event</CardTitle>
        <CardDescription>
          Choose a ministry pathway so the QR page, form options, messages, routing, and report focus match the event.
          After creation, you&apos;ll get a QR code to share with visitors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {params.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
        <form action={createEventAction} className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="name">Event name</Label>
            <Input id="name" name="name" placeholder="Pinetown SDA Health Expo" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventType">Event template</Label>
            <select id="eventType" name="eventType" defaultValue="sabbath_visitor" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              {eventTypeOptions.map((eventType) => (
                <option key={eventType} value={eventType}>{eventTypeLabels[eventType]}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startsOn">Date</Label>
            <Input id="startsOn" name="startsOn" type="date" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Church hall or community venue" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional notes for the team." />
          </div>
          <div className="grid gap-3 md:col-span-2">
            <div>
              <h3 className="text-sm font-bold">Template preview</h3>
              <p className="text-sm text-muted-foreground">These options drive the public form and suggested ministry pathway.</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {eventTemplateOptions.map((template) => (
                <div key={template.type} className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-bold">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.interestOptions.slice(0, 5).map((option, index) => (
                      <span key={`${template.type}-${option.value}-${index}`} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        {option.label}
                      </span>
                    ))}
                    {template.topicOptions?.length ? (
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                        Topic field
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="lg">Create event and get QR code</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
