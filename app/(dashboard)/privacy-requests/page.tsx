import { createDataRequestAction, updateDataRequestStatusAction } from "@/app/(dashboard)/_actions/privacy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDataRequests, getOpenDataRequestCount } from "@/lib/data";
import { getChurchContext } from "@/lib/data-context";

export const metadata = {
  title: "Privacy & Data Requests"
};

export default async function PrivacyPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const query = await searchParams;
  const context = await getChurchContext();
  const [dataRequests, openCount] = await Promise.all([
    getDataRequests(context.churchId),
    getOpenDataRequestCount(context.churchId)
  ]);

  const requestTypeLabels = {
    correction: "Correction",
    deletion: "Deletion",
    export: "Export",
    restriction: "Restriction"
  };

  const statusLabels = {
    open: "Open",
    in_review: "In Review",
    completed: "Completed",
    declined: "Declined"
  };

  const statusColors = {
    open: "bg-yellow-100 text-yellow-800",
    in_review: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800"
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Privacy & Data Requests</h1>
        <p className="text-muted-foreground">Manage privacy compliance and data subject requests.</p>
      </div>

      {(query.success || query.error) && (
        <div className={`rounded-lg p-4 ${query.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {query.success ? "Changes saved successfully." : query.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Privacy Notice Information</CardTitle>
          <CardDescription>Current privacy policy version and consent field explanations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">Privacy notice version:</p>
            <p className="text-muted-foreground">v1.0</p>
          </div>
          <div>
            <p className="font-semibold">Last updated:</p>
            <p className="text-muted-foreground">May 2026</p>
          </div>
          <div>
            <p className="font-semibold">Consent fields:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>consent_given:</strong> Boolean indicating if consent was given</li>
              <li><strong>consent_at:</strong> Timestamp when consent was given</li>
              <li><strong>consent_source:</strong> How consent was obtained (e.g., public_form, manual)</li>
              <li><strong>consent_status:</strong> Status of consent (given, unknown, not_given)</li>
              <li><strong>consent_text_snapshot:</strong> Exact consent wording at time of consent</li>
              <li><strong>privacy_policy_version:</strong> Version of privacy policy accepted</li>
              <li><strong>consent_recorded_by:</strong> User who recorded the consent</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">CSV export access:</p>
            <p className="text-muted-foreground">Restricted to admin, pastor, and app admin roles. All exports are logged in the audit trail.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Requests</CardTitle>
          <CardDescription>
            Track and manage correction, deletion, export, and restriction requests from data subjects.
            {openCount > 0 && <span className="ml-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">{openCount} open</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={createDataRequestAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="requestType">Request type *</Label>
              <select
                id="requestType"
                name="requestType"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="correction">Correction - Update incorrect information</option>
                <option value="deletion">Deletion - Delete personal information</option>
                <option value="export">Export - Provide copy of personal information</option>
                <option value="restriction">Restriction - Limit data processing</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requesterName">Requester name *</Label>
              <Input id="requesterName" name="requesterName" required maxLength={140} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requesterContact">Requester contact (optional)</Label>
              <Input id="requesterContact" name="requesterContact" placeholder="Phone or email" maxLength={200} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relatedContactId">Related contact ID (optional)</Label>
              <Input id="relatedContactId" name="relatedContactId" placeholder="UUID if applicable" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" placeholder="Additional context about the request..." rows={3} maxLength={1000} />
            </div>
            <Button type="submit">Create data request</Button>
          </form>

          {dataRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Recent requests</h3>
              {dataRequests.map((request) => (
                <div key={request.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{requestTypeLabels[request.request_type]}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requester: {request.requester_name}
                        {request.requester_contact && ` (${request.requester_contact})`}
                      </p>
                      {request.notes && <p className="text-sm">{request.notes}</p>}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    {request.status === "open" && (
                      <form action={updateDataRequestStatusAction} className="space-y-2">
                        <input type="hidden" name="requestId" value={request.id} />
                        <select
                          name="status"
                          required
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                          <option value="declined">Declined</option>
                        </select>
                        <Button type="submit" size="sm">Update</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
