import { supabase } from '@/services/supabase';

export interface Group {
  id: string;
  name: string;
  head: string;
  created_at: string;
  teams?: Team[];
}

export interface Team {
  id: string;
  name: string;
  flag: string | null;
  group_id: string;
  created_at: string;
  group?: Group;
}

export interface Match {
  id: string;
  stage: string;
  group_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_penalties: number | null;
  away_penalties: number | null;
  is_finished: boolean;
  match_date: string | null;
}

export const fetchGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase.from('groups').select('*, teams(*)').order('name');
  if (error) throw error;
  return data as Group[];
};

export const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase.from('teams').select('*, group:groups(*)').order('name');
  if (error) throw error;
  return data as Team[];
};

export const createTeam = async (team: Partial<Team>) => {
  const { data, error } = await supabase.from('teams').insert(team).select().single();
  if (error) throw error;
  return data;
};

export const updateTeam = async (id: string, updates: Partial<Team>) => {
  const { data, error } = await supabase.from('teams').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteTeam = async (id: string) => {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const updateGroup = async (id: string, updates: Partial<Group>) => {
  const { data, error } = await supabase.from('groups').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const fetchMatchesByGroup = async (groupId: string): Promise<Match[]> => {
  const { data, error } = await supabase.from('matches').select('*').eq('group_id', groupId).order('id');
  if (error) throw error;
  return data as Match[];
};

export const fetchAllMatches = async (): Promise<Match[]> => {
  const { data, error } = await supabase.from('matches').select('*').order('id');
  if (error) throw error;
  return data as Match[];
};

export const updateMatch = async (id: string, updates: Partial<Match>) => {
  const { data, error } = await supabase.from('matches').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
