import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitPublicDataRequestAction } from "./actions";

export const metadata = {
  title: "Privacy Request",
  description: "Submit a data request to a church",
};

export default async function PrivacyRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; church?: string; error?: string }>;
}) {
  const params = await searchParams;
  const churchSlug = params.church || "";
  const errorMessage = params.error ? decodeURIComponent(params.error) : null;
  const missingChurch = !churchSlug;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Privacy & Data Request</CardTitle>
          <CardDescription>
            Submit a request to correct, delete, export, or restrict your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Request Submitted</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your privacy request has been submitted. The church will review it and respond according to their privacy policy.
              </p>
              <Button asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          ) : missingChurch ? (
            <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Workspace link required</p>
              <p>
                Open this request form from a ShepherdRoute privacy link so the request can be routed to the correct church or ministry.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          ) : (
            <form action={submitPublicDataRequestAction} className="space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
              <input type="hidden" name="churchSlug" value={churchSlug} />
              
              <div>
                <Label htmlFor="requestType">Request Type</Label>
                <Select name="requestType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="correction">Correction</SelectItem>
                    <SelectItem value="deletion">Deletion</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="restriction">Restriction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requesterName">Your Name</Label>
                <Input
                  id="requesterName"
                  name="requesterName"
                  type="text"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="requesterContact">Your Contact (Email or Phone)</Label>
                <Input
                  id="requesterContact"
                  name="requesterContact"
                  type="text"
                  placeholder="Email address or phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Provide details about your request..."
                  rows={4}
                />
              </div>

              {/* Honeypot field for bot protection */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
