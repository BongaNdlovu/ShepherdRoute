import { addQuickContactAction } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { interestLabels, interestOptions } from "@/lib/constants";
import { prayerVisibilityLabels, prayerVisibilityOptions } from "@/lib/followUp";

type QuickContactFormProps = {
  events: Array<{ id: string; name: string }>;
};

export function QuickContactForm({ events }: QuickContactFormProps) {
  return (
    <Card id="add-contact" className="xl:sticky xl:top-6 xl:self-start">
      <CardHeader>
        <CardTitle>Manual intake</CardTitle>
        <CardDescription>Add someone who connected outside a QR form.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addQuickContactAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Name</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input id="phone" name="phone" placeholder="+27..." />
            <p className="text-xs text-muted-foreground">Phone or email is required</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="Optional" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="area">Area</Label>
            <Input id="area" name="area" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventId">Event</Label>
            <select id="eventId" name="eventId" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              <option value="">No event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Interest tags</Label>
            <div className="grid gap-2">
              {interestOptions.map((interest) => (
                <label key={interest} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" name="interests" value={interest} className="h-4 w-4" />
                  {interestLabels[interest]}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border p-4">
            <Label htmlFor="consentStatus">Consent status *</Label>
            <select
              id="consentStatus"
              name="consentStatus"
              defaultValue="given"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="given">Given - person consented to follow-up</option>
              <option value="unknown">Unknown - consent status unclear</option>
              <option value="not_given">Not given - person declined follow-up</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Select &quot;given&quot; if the person consented to follow-up. Select &quot;unknown&quot; if consent status is unclear. Select &quot;not given&quot; if the person declined follow-up.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="consentNote">Consent note (optional)</Label>
            <Textarea
              id="consentNote"
              name="consentNote"
              placeholder="Optional note about consent context or conversation..."
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prayerRequest">Prayer request or note</Label>
            <Textarea id="prayerRequest" name="prayerRequest" />
            <p className="text-xs text-muted-foreground">Prayer text is saved in the separate prayer request table.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prayerVisibility">Prayer visibility</Label>
            <select id="prayerVisibility" name="prayerVisibility" defaultValue="general_prayer" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
              {prayerVisibilityOptions.map((visibility) => (
                <option key={visibility} value={visibility}>{prayerVisibilityLabels[visibility]}</option>
              ))}
            </select>
          </div>
          <Button type="submit">Add contact</Button>
        </form>
      </CardContent>
    </Card>
  );
}
