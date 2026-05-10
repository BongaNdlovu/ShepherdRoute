import { createClient } from "@/lib/supabase/server";

export type MinistryTeam = {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  follow_up_categories: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  member_count?: number;
};

export type MinistryPerson = {
  id: string;
  church_id: string;
  full_name: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  teams?: Array<{ team_id: string; team_name: string; position_title: string | null }>;
};

export type MinistryTeamMembership = {
  id: string;
  church_id: string;
  team_id: string;
  person_id: string;
  position_title: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  person?: { full_name: string };
};

export type MinistrySuggestionCandidate = {
  team: MinistryTeam;
  memberships: Array<{
    id: string;
    person_id: string;
    position_title: string | null;
    person_full_name: string;
  }>;
};

export async function getMinistryTeams(churchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ministry_teams")
    .select("id, church_id, name, description, follow_up_categories, is_active, created_at, updated_at, deleted_at")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("[getMinistryTeams] error:", error);
    return [];
  }

  return (data ?? []) as MinistryTeam[];
}

export async function getMinistryTeamsWithMemberCounts(churchId: string) {
  const supabase = await createClient();
  const { data: teams, error: teamsError } = await supabase
    .from("ministry_teams")
    .select("id, church_id, name, description, follow_up_categories, is_active, created_at, updated_at, deleted_at")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .order("name");

  if (teamsError) {
    console.error("[getMinistryTeamsWithMemberCounts] teams error:", teamsError);
    return [];
  }

  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length === 0) {
    return (teams ?? []) as MinistryTeam[];
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("ministry_team_memberships")
    .select("team_id")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("team_id", teamIds);

  if (membershipsError) {
    console.error("[getMinistryTeamsWithMemberCounts] memberships error:", membershipsError);
    return (teams ?? []) as MinistryTeam[];
  }

  const countMap = new Map<string, number>();
  for (const row of memberships ?? []) {
    countMap.set(row.team_id, (countMap.get(row.team_id) ?? 0) + 1);
  }

  return (teams ?? []).map((team) => ({
    ...(team as unknown as MinistryTeam),
    member_count: countMap.get(team.id) ?? 0
  }));
}

export async function getMinistryTeamDetail(churchId: string, teamId: string) {
  const supabase = await createClient();
  const { data: team, error: teamError } = await supabase
    .from("ministry_teams")
    .select("id, church_id, name, description, follow_up_categories, is_active, created_at, updated_at, deleted_at")
    .eq("church_id", churchId)
    .eq("id", teamId)
    .is("deleted_at", null)
    .maybeSingle();

  if (teamError || !team) {
    console.error("[getMinistryTeamDetail] team error:", teamError);
    return null;
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("ministry_team_memberships")
    .select("id, church_id, team_id, person_id, position_title, notes, is_active, created_at, updated_at, deleted_at, ministry_people(full_name)")
    .eq("church_id", churchId)
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (membershipsError) {
    console.error("[getMinistryTeamDetail] memberships error:", membershipsError);
  }

  const formattedMemberships = (memberships ?? []).map((m) => {
    const personData = (m as unknown as Record<string, unknown>).ministry_people;
    const personName = Array.isArray(personData)
      ? (personData[0] as { full_name: string } | undefined)?.full_name ?? ""
      : (personData as { full_name: string } | undefined)?.full_name ?? "";

    return {
      id: m.id,
      church_id: m.church_id,
      team_id: m.team_id,
      person_id: m.person_id,
      position_title: m.position_title,
      notes: m.notes,
      is_active: m.is_active,
      created_at: m.created_at,
      updated_at: m.updated_at,
      deleted_at: m.deleted_at,
      person: { full_name: personName }
    } as MinistryTeamMembership;
  });

  return {
    team: team as unknown as MinistryTeam,
    memberships: formattedMemberships
  };
}

export async function getMinistryPeople(churchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ministry_people")
    .select("id, church_id, full_name, notes, is_active, created_at, updated_at, deleted_at")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .order("full_name");

  if (error) {
    console.error("[getMinistryPeople] error:", error);
    return [];
  }

  return (data ?? []) as MinistryPerson[];
}

export async function getMinistryPeopleWithTeams(churchId: string) {
  const supabase = await createClient();
  const { data: people, error: peopleError } = await supabase
    .from("ministry_people")
    .select("id, church_id, full_name, notes, is_active, created_at, updated_at, deleted_at")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .order("full_name");

  if (peopleError) {
    console.error("[getMinistryPeopleWithTeams] people error:", peopleError);
    return [];
  }

  const personIds = (people ?? []).map((p) => p.id);
  if (personIds.length === 0) {
    return (people ?? []) as MinistryPerson[];
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("ministry_team_memberships")
    .select("person_id, team_id, position_title, ministry_teams(name)")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("person_id", personIds);

  if (membershipsError) {
    console.error("[getMinistryPeopleWithTeams] memberships error:", membershipsError);
    return (people ?? []) as MinistryPerson[];
  }

  const teamsByPerson = new Map<string, Array<{ team_id: string; team_name: string; position_title: string | null }>>();

  for (const m of (memberships ?? []) as unknown as Array<{
    person_id: string;
    team_id: string;
    position_title: string | null;
    ministry_teams: { name: string } | { name: string }[];
  }>) {
    const teamData = m.ministry_teams;
    const teamName = Array.isArray(teamData)
      ? (teamData[0] as { name: string } | undefined)?.name ?? ""
      : (teamData as { name: string } | undefined)?.name ?? "";

    if (!teamsByPerson.has(m.person_id)) {
      teamsByPerson.set(m.person_id, []);
    }
    teamsByPerson.get(m.person_id)!.push({
      team_id: m.team_id,
      team_name: teamName,
      position_title: m.position_title
    });
  }

  return (people ?? []).map((person) => ({
    ...(person as unknown as MinistryPerson),
    teams: teamsByPerson.get(person.id) ?? []
  }));
}

export async function getMinistrySuggestionCandidates(churchId: string) {
  const supabase = await createClient();

  const { data: teams, error: teamsError } = await supabase
    .from("ministry_teams")
    .select("id, church_id, name, description, follow_up_categories, is_active, created_at, updated_at, deleted_at")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("name");

  if (teamsError) {
    console.error("[getMinistrySuggestionCandidates] teams error:", teamsError);
    return [];
  }

  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length === 0) {
    return [];
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("ministry_team_memberships")
    .select("id, team_id, person_id, position_title, ministry_people(full_name)")
    .eq("church_id", churchId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("team_id", teamIds);

  if (membershipsError) {
    console.error("[getMinistrySuggestionCandidates] memberships error:", membershipsError);
    return [];
  }

  const membershipsByTeam = new Map<string, Array<{ id: string; person_id: string; position_title: string | null; person_full_name: string }>>();

  for (const m of (memberships ?? []) as unknown as Array<{
    id: string;
    team_id: string;
    person_id: string;
    position_title: string | null;
    ministry_people: { full_name: string } | { full_name: string }[];
  }>) {
    const personData = m.ministry_people;
    const personName = Array.isArray(personData)
      ? (personData[0] as { full_name: string } | undefined)?.full_name ?? ""
      : (personData as { full_name: string } | undefined)?.full_name ?? "";

    if (!membershipsByTeam.has(m.team_id)) {
      membershipsByTeam.set(m.team_id, []);
    }
    membershipsByTeam.get(m.team_id)!.push({
      id: m.id,
      person_id: m.person_id,
      position_title: m.position_title,
      person_full_name: personName
    });
  }

  return (teams ?? []).map((team) => ({
    team: team as unknown as MinistryTeam,
    memberships: membershipsByTeam.get(team.id) ?? []
  }));
}
