import { supabase } from '@/services/supabase';

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_team_id?: string;
  predicted_away_team_id?: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number;
  created_at: string;
}

export interface PredictionAwards {
  user_id: string;
  top_scorer: string | null;
  top_assist: string | null;
  mvp: string | null;
  total_points?: number;
}

export const fetchUserPredictions = async (userId: string): Promise<Prediction[]> => {
  const { data, error } = await supabase.from('predictions').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as Prediction[];
};

export const fetchAllPredictions = async (): Promise<Prediction[]> => {
  const { data, error } = await supabase.from('predictions').select('*');
  if (error) throw error;
  return data as Prediction[];
};

export const fetchUserAwards = async (userId: string): Promise<PredictionAwards | null> => {
  const { data, error } = await supabase.from('prediction_awards').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
  return data as PredictionAwards | null;
};

export const saveUserAwards = async (userId: string, awards: Partial<PredictionAwards>) => {
  const { data: existing } = await supabase.from('prediction_awards').select('user_id').eq('user_id', userId).single();

  if (existing) {
    const { error } = await supabase.from('prediction_awards').update(awards).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('prediction_awards').insert({ user_id: userId, ...awards });
    if (error) throw error;
  }
};

export const savePrediction = async (
  userId: string, 
  matchId: string, 
  homeScore: number, 
  awayScore: number, 
  homeTeamId?: string, 
  awayTeamId?: string
) => {
  // Try to find existing prediction
  const { data: existing } = await supabase
    .from('predictions')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('predictions')
      .update({ 
        predicted_home_score: homeScore, 
        predicted_away_score: awayScore,
        predicted_home_team_id: homeTeamId || null,
        predicted_away_team_id: awayTeamId || null
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        predicted_home_team_id: homeTeamId || null,
        predicted_away_team_id: awayTeamId || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

import { fetchAllMatches, fetchOfficialAwards, type Match } from '@/modules/admin/services/admin.service';

export const recalculateAllLeaderboards = async () => {
  // 1. Traer todos los datos reales
  const matches = await fetchAllMatches();
  const officialAwards = await fetchOfficialAwards();
  
  // 2. Traer todas las predicciones de los usuarios
  const { data: allPredictions } = await supabase.from('predictions').select('*');
  const { data: allAwards } = await supabase.from('prediction_awards').select('*');
  
  if (!allPredictions) return;

  const finishedMatches = matches.filter(m => m.is_finished);
  
  const userPointsMap: Record<string, number> = {};
  const predictionUpdates: any[] = [];
  const awardsUpdates: any[] = [];

  // Inicializar mapa de puntos
  allAwards?.forEach(a => { userPointsMap[a.user_id] = 0; });
  allPredictions.forEach(p => { if (!(p.user_id in userPointsMap)) userPointsMap[p.user_id] = 0; });

  // Agrupar predicciones por usuario
  const predictionsByUser: Record<string, Prediction[]> = {};
  allPredictions.forEach(p => {
    if (!predictionsByUser[p.user_id]) predictionsByUser[p.user_id] = [];
    predictionsByUser[p.user_id].push(p as Prediction);
  });

  // Calcular puntos
  for (const userId of Object.keys(predictionsByUser)) {
    let totalPoints = 0;
    const userPreds = predictionsByUser[userId];

    for (const pred of userPreds) {
      const realMatch = finishedMatches.find(m => m.id === pred.match_id);
      let matchPoints = 0;

      if (realMatch && realMatch.home_score !== null && realMatch.away_score !== null) {
        // Regla 1: Resultado exacto (5 pts) / Ganador (3 pts)
        if (pred.predicted_home_score === realMatch.home_score && pred.predicted_away_score === realMatch.away_score) {
          matchPoints += 5;
        } else {
          const actualWinner = realMatch.home_score > realMatch.away_score ? 'HOME' : realMatch.home_score < realMatch.away_score ? 'AWAY' : 'DRAW';
          const predWinner = pred.predicted_home_score > pred.predicted_away_score ? 'HOME' : pred.predicted_home_score < pred.predicted_away_score ? 'AWAY' : 'DRAW';
          if (actualWinner === predWinner) {
            matchPoints += 3;
          }
        }

        // Regla 2: Cruce exacto en rondas eliminatorias (5 pts)
        if (realMatch.stage !== 'GROUP' && realMatch.home_team_id && realMatch.away_team_id) {
          if (
            (pred.predicted_home_team_id === realMatch.home_team_id && pred.predicted_away_team_id === realMatch.away_team_id) ||
            (pred.predicted_home_team_id === realMatch.away_team_id && pred.predicted_away_team_id === realMatch.home_team_id)
          ) {
            matchPoints += 5;
          }
        }
      }

      // Regla 3: Equipo llega a una ronda determinada (2 pts)
      // Se evalúa verificando si el equipo predicho aparece en ALGUN partido real de la misma ronda
      if (pred.predicted_home_team_id || pred.predicted_away_team_id) {
        const stageMatches = finishedMatches.filter(m => m.stage === realMatch?.stage || matches.find(rm => rm.id === pred.match_id)?.stage);
        const teamsInStage = new Set<string>();
        stageMatches.forEach(sm => {
           if (sm.home_team_id) teamsInStage.add(sm.home_team_id);
           if (sm.away_team_id) teamsInStage.add(sm.away_team_id);
        });

        if (pred.predicted_home_team_id && teamsInStage.has(pred.predicted_home_team_id)) matchPoints += 2;
        if (pred.predicted_away_team_id && teamsInStage.has(pred.predicted_away_team_id)) matchPoints += 2;
        
        // Ajuste: Para no dar doble puntaje por el mismo equipo en la misma ronda si el usuario lo predice varias veces por error,
        // esto es por cada slot que atinó.
      }

      totalPoints += matchPoints;
      predictionUpdates.push({ id: pred.id, points_earned: matchPoints });
    }

    // Regla 4: Premios Globales
    const uAward = allAwards?.find(a => a.user_id === userId);
    if (officialAwards && uAward) {
      if (officialAwards.top_scorer && officialAwards.top_scorer === uAward.top_scorer) totalPoints += 10;
      if (officialAwards.top_assist && officialAwards.top_assist === uAward.top_assist) totalPoints += 10;
      if (officialAwards.mvp && officialAwards.mvp === uAward.mvp) totalPoints += 10;
      
      // Podio
      // Campeón (+20) -> Validar la predicción FINAL
      const finalPred = userPreds.find(p => {
        const rm = matches.find(m => m.id === p.match_id);
        return rm?.stage === 'FINAL';
      });
      if (finalPred && officialAwards.champion_team_id) {
        const predWinnerId = finalPred.predicted_home_score > finalPred.predicted_away_score ? finalPred.predicted_home_team_id :
                             finalPred.predicted_home_score < finalPred.predicted_away_score ? finalPred.predicted_away_team_id : null;
        if (predWinnerId === officialAwards.champion_team_id) totalPoints += 20;
      }

      // Subcampeón (+10) -> El perdedor de la FINAL
      if (finalPred && officialAwards.runner_up_team_id) {
        const predLoserId = finalPred.predicted_home_score < finalPred.predicted_away_score ? finalPred.predicted_home_team_id :
                            finalPred.predicted_home_score > finalPred.predicted_away_score ? finalPred.predicted_away_team_id : null;
        if (predLoserId === officialAwards.runner_up_team_id) totalPoints += 10;
      }

      // Tercer Lugar (+5) -> Ganador del partido 3RD
      const thirdPred = userPreds.find(p => {
        const rm = matches.find(m => m.id === p.match_id);
        return rm?.stage === '3RD';
      });
      if (thirdPred && officialAwards.third_place_team_id) {
        const predThirdId = thirdPred.predicted_home_score > thirdPred.predicted_away_score ? thirdPred.predicted_home_team_id :
                            thirdPred.predicted_home_score < thirdPred.predicted_away_score ? thirdPred.predicted_away_team_id : null;
        if (predThirdId === officialAwards.third_place_team_id) totalPoints += 5;
      }
    }

    userPointsMap[userId] = totalPoints;
    if (uAward) {
      awardsUpdates.push({ user_id: userId, total_points: totalPoints });
    } else {
      awardsUpdates.push({ user_id: userId, total_points: totalPoints });
    }
  }

  // Guardado masivo
  // Debido a las restricciones de Supabase sin RPC, haremos las actualizaciones por lotes
  const chunkSize = 50;
  for (let i = 0; i < predictionUpdates.length; i += chunkSize) {
    const chunk = predictionUpdates.slice(i, i + chunkSize);
    await supabase.from('predictions').upsert(chunk);
  }

  for (let i = 0; i < awardsUpdates.length; i += chunkSize) {
    const chunk = awardsUpdates.slice(i, i + chunkSize);
    await supabase.from('prediction_awards').upsert(chunk, { onConflict: 'user_id' });
  }

  return true;
};

// Deprecated since recalculateAllLeaderboards runs globally
export const calculateMatchPoints = async () => {};

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
}

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase.from('prediction_awards').select('user_id, total_points');
  if (error) throw error;

  const entries: LeaderboardEntry[] = (data || []).map(row => ({
    userId: row.user_id,
    username: row.user_id.substring(0, 8), // Fallback
    totalPoints: row.total_points || 0
  }));

  return entries.sort((a, b) => b.totalPoints - a.totalPoints);
};
