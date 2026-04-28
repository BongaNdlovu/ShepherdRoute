import { CheckCircle2, UserPlus } from "lucide-react";
import { addTeamMemberAction } from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabels, roleOptions } from "@/lib/constants";
import { getChurchContext, getTeamMembers } from "@/lib/data";
import { initials } from "@/lib/utils";

export const metadata = {
  title: "Team"
};

export default async function TeamPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const team = await getTeamMembers(context.churchId);

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Church team</CardTitle>
          <CardDescription>Add pastors, elders, Bible workers, health leaders, prayer team members, and youth leaders for assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {team.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted font-black text-slate-700">
                    {initials(member.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{member.display_name}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[member.role as keyof typeof roleLabels]}</p>
                  </div>
                </div>
                <Badge variant={member.is_active ? "success" : "muted"}>
                  {member.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-6 xl:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add team member
          </CardTitle>
          <CardDescription>These people can be assigned follow-up even before they have their own login.</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error ? <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{params.error}</p> : null}
          <form action={addTeamMemberAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" name="displayName" placeholder="Bible Worker Rachel" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" defaultValue="bible_worker" className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{roleLabels[role]}</option>
                ))}
              </select>
            </div>
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4" />
              Add to team
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
