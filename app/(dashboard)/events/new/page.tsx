import { createEventAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { eventTypeLabels, eventTypeOptions } from "@/lib/constants";

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
        <CardDescription>Use this for visitor Sabbaths, expos, prophecy seminars, Bible studies, health programs, and youth events.</CardDescription>
      </CardHeader>
      <CardContent>
        {params.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
        <form action={createEventAction} className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="name">Event name</Label>
            <Input id="name" name="name" placeholder="Pinetown SDA Health Expo" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventType">Event type</Label>
            <select id="eventType" name="eventType" defaultValue="health_expo" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
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
          <div className="md:col-span-2">
            <Button type="submit" size="lg">Create QR registration page</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
