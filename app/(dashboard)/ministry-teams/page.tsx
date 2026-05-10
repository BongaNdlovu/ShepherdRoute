import Link from "next/link";
import { Handshake, Users, Plus, Pencil, Archive, ChevronRight } from "lucide-react";
import {
  createMinistryTeamAction,
  updateMinistryTeamAction,
  archiveMinistryTeamAction,
  createMinistryPersonAction,
  updateMinistryPersonAction,
  archiveMinistryPersonAction,
  addMinistryTeamMembershipAction,
  updateMinistryTeamMembershipAction,
  archiveMinistryTeamMembershipAction
} from "@/app/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CinematicSection } from "@/components/ui/cinematic-section";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { followUpCategoryLabels, followUpCategoryOptions } from "@/lib/constants";
import { getChurchContext, getMinistryTeamsWithMemberCounts, getMinistryPeopleWithTeams, getMinistryTeamDetail } from "@/lib/data";
import { canManageMinistryTeams, canViewMinistryTeams } from "@/lib/permissions";
import type { AppRole, TeamRole } from "@/lib/constants";

export const metadata = {
  title: "Ministry Teams"
};

export default async function MinistryTeamsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; team?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const context = await getChurchContext();
  const userCanView = canViewMinistryTeams(context.role as TeamRole, context.appRole as AppRole | null);
  const userCanManage = canManageMinistryTeams(context.role as TeamRole, context.appRole as AppRole | null);

  if (!userCanView) {
    return (
      <DashboardShell title="Ministry Teams" description="Organize follow-up roles">
        <CinematicSection className="cinematic-fade-up">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">You do not have permission to view ministry teams.</p>
            </CardContent>
          </Card>
        </CinematicSection>
      </DashboardShell>
    );
  }

  const [teams, people] = await Promise.all([
    getMinistryTeamsWithMemberCounts(context.churchId),
    getMinistryPeopleWithTeams(context.churchId)
  ]);

  const selectedTeamId = params.team;
  const selectedTeam = selectedTeamId ? await getMinistryTeamDetail(context.churchId, selectedTeamId) : null;
  const activeTab = params.tab ?? (selectedTeam ? "teams" : "teams");

  return (
    <DashboardShell
      title="Ministry Teams"
      description="Organize follow-up teams and people for smarter contact suggestions."
    >
      <CinematicSection className="cinematic-fade-up">
        {params.error ? (
          <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p>
        ) : null}
        {params.success ? (
          <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{params.success}</p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
              <Link
                href="/ministry-teams?tab=teams"
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${activeTab === "teams" ? "bg-amber-100 text-amber-950" : "text-muted-foreground hover:bg-muted"}`}
              >
                Teams
              </Link>
              <Link
                href="/ministry-teams?tab=people"
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${activeTab === "people" ? "bg-amber-100 text-amber-950" : "text-muted-foreground hover:bg-muted"}`}
              >
                People Directory
              </Link>
            </div>

            {activeTab === "teams" ? (
              <TeamsSection
                teams={teams}
                selectedTeam={selectedTeam}
                userCanManage={userCanManage}
              />
            ) : (
              <PeopleSection people={people} userCanManage={userCanManage} />
            )}
          </div>

          {userCanManage ? (
            <div className="space-y-6">
              {activeTab === "teams" && !selectedTeam ? (
                <CreateTeamForm />
              ) : activeTab === "teams" && selectedTeam ? (
                <>
                  <EditTeamForm team={selectedTeam.team} />
                  <AddMembershipForm teamId={selectedTeam.team.id} people={people} />
                </>
              ) : (
                <CreatePersonForm />
              )}
            </div>
          ) : null}
        </div>
      </CinematicSection>
    </DashboardShell>
  );
}

function TeamsSection({
  teams,
  selectedTeam,
  userCanManage
}: {
  teams: Awaited<ReturnType<typeof getMinistryTeamsWithMemberCounts>>;
  selectedTeam: Awaited<ReturnType<typeof getMinistryTeamDetail>>;
  userCanManage: boolean;
}) {
  if (selectedTeam) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/ministry-teams?tab=teams" className="text-sm text-muted-foreground hover:underline">
            All teams
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{selectedTeam.team.name}</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedTeam.team.name}</CardTitle>
                <CardDescription>{selectedTeam.team.description ?? "No description"}</CardDescription>
              </div>
              <Badge variant={selectedTeam.team.is_active ? "success" : "muted"}>
                {selectedTeam.team.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedTeam.team.follow_up_categories.map((cat) => (
                <Badge key={cat} variant="secondary">{followUpCategoryLabels[cat as keyof typeof followUpCategoryLabels] ?? cat}</Badge>
              ))}
              {selectedTeam.team.follow_up_categories.length === 0 ? (
                <span className="text-sm text-muted-foreground">No follow-up categories assigned</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Team Members ({selectedTeam.memberships.length})</h4>
              {selectedTeam.memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTeam.memberships.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{m.person?.full_name ?? "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{m.position_title ?? "Member"}</p>
                        {userCanManage ? (
                          <form action={updateMinistryTeamMembershipAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                            <input type="hidden" name="membershipId" value={m.id} />
                            <input type="hidden" name="teamId" value={selectedTeam.team.id} />
                            <input type="hidden" name="personId" value={m.person_id} />
                            <Input name="positionTitle" defaultValue={m.position_title ?? ""} placeholder="Position / title" />
                            <Input name="notes" defaultValue={m.notes ?? ""} placeholder="Notes" />
                            <input type="hidden" name="isActive" value={m.is_active ? "on" : ""} />
                            <Button type="submit" size="sm" variant="outline">Update</Button>
                          </form>
                        ) : null}
                      </div>
                      {userCanManage ? (
                        <form action={archiveMinistryTeamMembershipAction}>
                          <input type="hidden" name="membershipId" value={m.id} />
                          <input type="hidden" name="teamId" value={selectedTeam.team.id} />
                          <Button type="submit" size="sm" variant="ghost">
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Handshake className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No ministry teams yet. Create your first team to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        teams.map((team) => (
          <Card key={team.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/ministry-teams?tab=teams&team=${team.id}`} className="font-semibold hover:underline">
                      {team.name}
                    </Link>
                    <Badge variant={team.is_active ? "success" : "muted"} className="text-xs">
                      {team.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{team.description ?? "No description"}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {team.follow_up_categories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">{followUpCategoryLabels[cat as keyof typeof followUpCategoryLabels] ?? cat}</Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{team.member_count ?? 0} members</p>
                </div>
                {userCanManage ? (
                  <form action={archiveMinistryTeamAction}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function PeopleSection({
  people,
  userCanManage
}: {
  people: Awaited<ReturnType<typeof getMinistryPeopleWithTeams>>;
  userCanManage: boolean;
}) {
  return (
    <div className="space-y-4">
      {people.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No people in the directory yet. Add your first person to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        people.map((person) => (
          <Card key={person.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{person.full_name}</span>
                    <Badge variant={person.is_active ? "success" : "muted"} className="text-xs">
                      {person.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {person.notes ? <p className="mt-1 text-sm text-muted-foreground">{person.notes}</p> : null}
                  {person.teams && person.teams.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {person.teams.map((t) => (
                        <div key={t.team_id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{t.team_name}</span>
                          {t.position_title ? <Badge variant="outline" className="text-xs">{t.position_title}</Badge> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Not assigned to any team</p>
                  )}
                  {userCanManage ? (
                    <form action={updateMinistryPersonAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="personId" value={person.id} />
                      <Input name="fullName" defaultValue={person.full_name} required minLength={2} maxLength={160} />
                      <Input name="notes" defaultValue={person.notes ?? ""} placeholder="Notes" />
                      <input type="hidden" name="isActive" value={person.is_active ? "on" : ""} />
                      <Button type="submit" size="sm" variant="outline">Update</Button>
                    </form>
                  ) : null}
                </div>
                {userCanManage ? (
                  <form action={archiveMinistryPersonAction}>
                    <input type="hidden" name="personId" value={person.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function CreateTeamForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Team
        </CardTitle>
        <CardDescription>Create a new ministry follow-up team.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createMinistryTeamAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" name="name" placeholder="Prayer Team" required minLength={2} maxLength={120} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="What this team does" />
          </div>
          <div className="grid gap-2">
            <Label>Follow-Up Categories</Label>
            <div className="grid gap-2">
              {followUpCategoryOptions.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="followUpCategories" value={cat} className="h-4 w-4 rounded border-input" />
                  {followUpCategoryLabels[cat]}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-input" />
            Active
          </label>
          <Button type="submit">Create Team</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EditTeamForm({ team }: { team: { id: string; name: string; description: string | null; follow_up_categories: string[]; is_active: boolean } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pencil className="h-5 w-5" />
          Edit Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateMinistryTeamAction} className="grid gap-4">
          <input type="hidden" name="teamId" value={team.id} />
          <div className="grid gap-2">
            <Label htmlFor="editName">Team Name</Label>
            <Input id="editName" name="name" defaultValue={team.name} required minLength={2} maxLength={120} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="editDescription">Description</Label>
            <Input id="editDescription" name="description" defaultValue={team.description ?? ""} />
          </div>
          <div className="grid gap-2">
            <Label>Follow-Up Categories</Label>
            <div className="grid gap-2">
              {followUpCategoryOptions.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="followUpCategories"
                    value={cat}
                    defaultChecked={team.follow_up_categories.includes(cat)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {followUpCategoryLabels[cat]}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={team.is_active} className="h-4 w-4 rounded border-input" />
            Active
          </label>
          <Button type="submit">Update Team</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreatePersonForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Person
        </CardTitle>
        <CardDescription>Add someone to the ministry directory.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createMinistryPersonAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="John Smith" required minLength={2} maxLength={160} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional notes" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-input" />
            Active
          </label>
          <Button type="submit">Add Person</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddMembershipForm({
  teamId,
  people
}: {
  teamId: string;
  people: Awaited<ReturnType<typeof getMinistryPeopleWithTeams>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add to Team
        </CardTitle>
        <CardDescription>Assign a person to this team.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={addMinistryTeamMembershipAction} className="grid gap-4">
          <input type="hidden" name="teamId" value={teamId} />
          <div className="grid gap-2">
            <Label htmlFor="personId">Person</Label>
            <select
              id="personId"
              name="personId"
              required
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a person</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="positionTitle">Position / Title</Label>
            <Input id="positionTitle" name="positionTitle" placeholder="Team Leader, Coordinator, etc." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="membershipNotes">Notes</Label>
            <Input id="membershipNotes" name="notes" placeholder="Optional" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-input" />
            Active
          </label>
          <Button type="submit">Add to Team</Button>
        </form>
      </CardContent>
    </Card>
  );
}
