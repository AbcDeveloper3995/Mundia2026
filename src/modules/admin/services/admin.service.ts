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
