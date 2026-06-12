import { supabase } from '@/services/supabase';
import { spendUserCoins } from './economy.service';
import { fetchAllMatches, fetchTeams } from '@/modules/admin/services/admin.service';
import { fetchUserPredictions } from '@/modules/predictions/services/predictions.service';
import { getPointsBreakdown } from '@/utils/tournament.rules';
import { fetchAllPaginated } from '@/services/supabase';

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  match_id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'resolved' | 'tied' | 'expired';
  winner_id: string | null;
  created_at: string;
  challenger?: { name: string; avatar: string | null };
  challenged?: { name: string; avatar: string | null };
}

export const fetchChallenges = async (userId: string): Promise<Challenge[]> => {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  const challenges = data as Challenge[];
  if (challenges.length === 0) return challenges;

  // Fetch profiles to map names manually avoiding relationship cache errors
  const profilesData = await fetchAllPaginated('profiles', 'id, username') as any[];
  const profilesMap: Record<string, string> = {};
  if (profilesData) {
    profilesData.forEach(p => { profilesMap[p.id] = p.username; });
  }

  return challenges.map(c => ({
    ...c,
    challenger: { name: profilesMap[c.challenger_id] || 'Usuario', avatar: null },
    challenged: { name: profilesMap[c.challenged_id] || 'Usuario', avatar: null }
  }));
};

export const createChallenge = async (challengerId: string, challengedId: string, matchId: string, amount: number) => {
  // 1. Verify if they haven't sent a challenge today
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const { data: existingOutgoing, error: outError } = await supabase
    .from('challenges')
    .select('id')
    .eq('challenger_id', challengerId)
    .gte('created_at', todayStart.toISOString());
    
  if (outError) throw outError;
  if (existingOutgoing && existingOutgoing.length > 0) {
    throw new Error('Ya enviaste tu reto de hoy. Vuelve a intentarlo mañana.');
  }

  // 2. Verify if the target hasn't received a challenge today
  const { data: existingIncoming, error: inError } = await supabase
    .from('challenges')
    .select('id')
    .eq('challenged_id', challengedId)
    .gte('created_at', todayStart.toISOString());
    
  if (inError) throw inError;
  if (existingIncoming && existingIncoming.length > 0) {
    throw new Error('Este usuario ya fue retado hoy. Elige a otra víctima.');
  }

  // 3. Deduct MC from Challenger
  await spendUserCoins(challengerId, amount);

  // 4. Create challenge
  const { data, error } = await supabase
    .from('challenges')
    .insert([{
      challenger_id: challengerId,
      challenged_id: challengedId,
      match_id: matchId,
      amount: amount,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    // Attempt refund if DB insert fails
    await spendUserCoins(challengerId, -amount).catch(() => {});
    throw error;
  }
  return data as Challenge;
};

export const acceptChallenge = async (challengeId: string, challengedId: string, amount: number) => {
  // Deduct MC from Challenged
  await spendUserCoins(challengedId, amount);

  const { data, error } = await supabase
    .from('challenges')
    .update({ status: 'accepted' })
    .eq('id', challengeId)
    .select()
    .single();

  if (error) {
    // Refund if fail
    await spendUserCoins(challengedId, -amount).catch(() => {});
    throw error;
  }
  return data as Challenge;
};

export const declineChallenge = async (challengeId: string, challengerId: string, amount: number) => {
  // Refund to Challenger
  await spendUserCoins(challengerId, -amount);

  const { data, error } = await supabase
    .from('challenges')
    .update({ status: 'declined' })
    .eq('id', challengeId)
    .select()
    .single();

  if (error) throw error;
  return data as Challenge;
};

export const resolveChallengesForMatch = async (matchId: string) => {
  try {
    // 1. Fetch all accepted challenges for this match
    const { data: challenges, error: fetchErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('match_id', matchId)
      .in('status', ['accepted', 'pending']);
      
    if (fetchErr) throw fetchErr;
    if (!challenges || challenges.length === 0) return;

    // 2. Fetch matches and teams to use getPointsBreakdown
    const [allMatches, allTeams] = await Promise.all([
      fetchAllMatches(),
      fetchTeams()
    ]);
    
    const realMatch = allMatches.find(m => m.id === matchId);
    if (!realMatch || !realMatch.is_finished) return;

    for (const challenge of challenges) {
      // Expirar retos pendientes no contestados y reembolsar al retador
      if (challenge.status === 'pending') {
        await spendUserCoins(challenge.challenger_id, -challenge.amount);
        await supabase.from('challenges').update({ status: 'expired' }).eq('id', challenge.id);
        continue;
      }

      // Fetch predictions for both users
      const [challengerPreds, challengedPreds] = await Promise.all([
        fetchUserPredictions(challenge.challenger_id),
        fetchUserPredictions(challenge.challenged_id)
      ]);

      const challengerPred = challengerPreds.find(p => p.match_id === matchId);
      const challengedPred = challengedPreds.find(p => p.match_id === matchId);

      const challengerPoints = getPointsBreakdown(realMatch, challengerPred, allMatches, allTeams).total;
      const challengedPoints = getPointsBreakdown(realMatch, challengedPred, allMatches, allTeams).total;

      if (challengerPoints === challengedPoints) {
        // Empate técnico -> Refund both
        await Promise.all([
          spendUserCoins(challenge.challenger_id, -challenge.amount),
          spendUserCoins(challenge.challenged_id, -challenge.amount)
        ]);
        
        await supabase.from('challenges').update({ status: 'tied' }).eq('id', challenge.id);
      } else if (challengerPoints > challengedPoints) {
        // Challenger wins -> Grant 2x amount
        await spendUserCoins(challenge.challenger_id, -(challenge.amount * 2));
        await supabase.from('challenges').update({ status: 'resolved', winner_id: challenge.challenger_id }).eq('id', challenge.id);
      } else {
        // Challenged wins -> Grant 2x amount
        await spendUserCoins(challenge.challenged_id, -(challenge.amount * 2));
        await supabase.from('challenges').update({ status: 'resolved', winner_id: challenge.challenged_id }).eq('id', challenge.id);
      }
    }
  } catch (error) {
    console.error('Error resolving challenges for match', matchId, error);
  }
};
