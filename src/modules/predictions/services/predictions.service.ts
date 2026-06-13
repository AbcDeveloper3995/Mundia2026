import { supabase, fetchAllPaginated } from '@/services/supabase';

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_team_id?: string;
  predicted_away_team_id?: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_penalty_winner?: 'HOME' | 'AWAY' | null;
  points_earned: number;
  created_at: string;
}

export interface PredictionAwards {
  user_id: string;
  top_scorer: string | null;
  top_assist: string | null;
  mvp: string | null;
  champion_team_id?: string | null;
  runner_up_team_id?: string | null;
  third_place_team_id?: string | null;
  total_points?: number;
  coins?: number;
}

export const fetchUserPredictions = async (userId: string): Promise<Prediction[]> => {
  const { data, error } = await supabase.from('predictions').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as Prediction[];
};

export const fetchAllPredictions = async (): Promise<Prediction[]> => {
  const data = await fetchAllPaginated('predictions');
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

export const saveAllPredictions = async (
  userId: string,
  predictionsToSave: { match_id: string; home_score: number; away_score: number; home_team_id?: string; away_team_id?: string; penalty_winner?: 'HOME' | 'AWAY' | null }[]
) => {
  const { data: existing } = await supabase
    .from('predictions')
    .select('id, match_id')
    .eq('user_id', userId);
    
  const existingMap = new Map(existing?.map(e => [e.match_id, e.id]) || []);
  
  const updates = [];
  const inserts = [];
  
  for (const p of predictionsToSave) {
    const existingId = existingMap.get(p.match_id);
    if (existingId) {
      updates.push({
        id: existingId,
        user_id: userId,
        match_id: p.match_id,
        predicted_home_score: p.home_score,
        predicted_away_score: p.away_score,
        predicted_home_team_id: p.home_team_id || null,
        predicted_away_team_id: p.away_team_id || null,
        predicted_penalty_winner: p.penalty_winner || null
      });
    } else {
      inserts.push({
        user_id: userId,
        match_id: p.match_id,
        predicted_home_score: p.home_score,
        predicted_away_score: p.away_score,
        predicted_home_team_id: p.home_team_id || null,
        predicted_away_team_id: p.away_team_id || null,
        predicted_penalty_winner: p.penalty_winner || null
      });
    }
  }
  
  if (inserts.length > 0) {
    const { error } = await supabase.from('predictions').insert(inserts);
    if (error) throw error;
  }
  
  if (updates.length > 0) {
    const { error } = await supabase.from('predictions').upsert(updates);
    if (error) throw error;
  }
};

import { fetchAllMatches, fetchOfficialAwards, type Match } from '@/modules/admin/services/admin.service';
import { fetchGlobalSettings } from '@/modules/dashboard/services/economy.service';

export const recalculateAllLeaderboards = async () => {
  // 1. Traer todos los datos reales
  const matches = await fetchAllMatches();
  const officialAwards = await fetchOfficialAwards();
  
  // 2. Traer todas las predicciones de los usuarios
  const allPredictions = await fetchAllPaginated('predictions');
  const allAwards = await fetchAllPaginated('prediction_awards', '*', 'user_id');
  
  if (!allPredictions) return;

  const finishedMatches = matches.filter(m => m.is_finished);
  
  const userPointsMap: Record<string, number> = {};
  const predictionUpdates: any[] = [];
  const awardsUpdates: any[] = [];

  // Inicializar mapa de puntos
  allAwards?.forEach((a: any) => { userPointsMap[a.user_id] = 0; });
  allPredictions.forEach((p: any) => { if (!(p.user_id in userPointsMap)) userPointsMap[p.user_id] = 0; });

  // Agrupar predicciones por usuario
  const predictionsByUser: Record<string, Prediction[]> = {};
  allPredictions.forEach((p: any) => {
    if (!predictionsByUser[p.user_id]) predictionsByUser[p.user_id] = [];
    predictionsByUser[p.user_id].push(p as Prediction);
  });

  // Calcular puntos y monedas
  for (const userId of Object.keys(predictionsByUser)) {
    let totalPoints = 0;
    let totalCoins = 100; // Saldo Inicial
    const userPreds = predictionsByUser[userId];

    for (const pred of userPreds) {
      let matchPoints = 0;
      const matchConfig = matches.find(m => m.id === pred.match_id);
      if (!matchConfig) continue;

      const stage = matchConfig.stage;
      const isKnockout = stage !== 'GROUP';

      // REGLAS ELIMINATORIAS
      if (isKnockout) {
        // Obtenemos todos los equipos reales que llegaron a esta ronda
        const stageMatches = matches.filter(m => m.stage === stage);
        const teamsInStage = new Set<string>();
        stageMatches.forEach(sm => {
          if (sm.home_team_id) teamsInStage.add(sm.home_team_id);
          if (sm.away_team_id) teamsInStage.add(sm.away_team_id);
        });

        // Acertar que un equipo llega a una ronda: 2 puntos por equipo
        if (pred.predicted_home_team_id && teamsInStage.has(pred.predicted_home_team_id)) {
          matchPoints += 2;
        }
        if (pred.predicted_away_team_id && teamsInStage.has(pred.predicted_away_team_id)) {
          matchPoints += 2;
        }

        // Acertar el enfrentamiento completo: 5 puntos
        if (
          matchConfig.home_team_id && matchConfig.away_team_id &&
          pred.predicted_home_team_id && pred.predicted_away_team_id
        ) {
          if (
            (pred.predicted_home_team_id === matchConfig.home_team_id && pred.predicted_away_team_id === matchConfig.away_team_id) ||
            (pred.predicted_home_team_id === matchConfig.away_team_id && pred.predicted_away_team_id === matchConfig.home_team_id)
          ) {
            matchPoints += 5;
          }
        }
      }

      // REGLAS DE PARTIDO (Score exacto o ganador)
      if (matchConfig.is_finished && matchConfig.home_score !== null && matchConfig.away_score !== null) {
        // En eliminatorias, el usuario debe haber acertado los equipos para recibir puntos por el marcador
        let canEarnScorePoints = true;
        let realHomeScore = matchConfig.home_score;
        let realAwayScore = matchConfig.away_score;

        if (isKnockout) {
          canEarnScorePoints = false;
          if (
            pred.predicted_home_team_id === matchConfig.home_team_id && 
            pred.predicted_away_team_id === matchConfig.away_team_id
          ) {
            canEarnScorePoints = true;
          } else if (
            pred.predicted_home_team_id === matchConfig.away_team_id && 
            pred.predicted_away_team_id === matchConfig.home_team_id
          ) {
            canEarnScorePoints = true;
            realHomeScore = matchConfig.away_score;
            realAwayScore = matchConfig.home_score;
          }
        }

        if (canEarnScorePoints) {
          if (pred.predicted_home_score === null || pred.predicted_home_score === undefined || pred.predicted_home_score < 0 || pred.predicted_away_score === null || pred.predicted_away_score === undefined || pred.predicted_away_score < 0) {
            // Fallo absoluto por no predecir: penalidad
            totalCoins -= 10;
          } else {
            // Resultado exacto: 5 puntos
            if (pred.predicted_home_score === realHomeScore && pred.predicted_away_score === realAwayScore) {
              matchPoints += 5;
              totalCoins += 50;
            } else {
              // Ganador o empate correcto: 3 puntos
              const actualWinner = realHomeScore > realAwayScore ? 'HOME' : realHomeScore < realAwayScore ? 'AWAY' : 'DRAW';
              const predWinner = pred.predicted_home_score > pred.predicted_away_score ? 'HOME' : pred.predicted_home_score < pred.predicted_away_score ? 'AWAY' : 'DRAW';
              if (actualWinner === predWinner) {
                matchPoints += 3;
                totalCoins += 20;
              } else {
                // Fallo absoluto: penalidad
                totalCoins -= 10;
              }
            }
          }
        }
      }

      totalPoints += matchPoints;
      predictionUpdates.push({ id: pred.id, points_earned: matchPoints });
    }

    // REGLAS PREMIOS ESPECIALES
    const uAward = allAwards?.find(a => a.user_id === userId);
    if (officialAwards && uAward) {
      if (officialAwards.top_scorer && officialAwards.top_scorer === uAward.top_scorer) { totalPoints += 10; totalCoins += 100; }
      if (officialAwards.top_assist && officialAwards.top_assist === uAward.top_assist) { totalPoints += 10; totalCoins += 100; }
      if (officialAwards.mvp && officialAwards.mvp === uAward.mvp) { totalPoints += 10; totalCoins += 100; }
      
      // Campeón (+20) -> Validar la predicción FINAL
      const finalPred = userPreds.find(p => {
        const rm = matches.find(m => m.id === p.match_id);
        return rm?.stage === 'FINAL';
      });
      if (finalPred && officialAwards.champion_team_id) {
        const predWinnerId = finalPred.predicted_home_score > finalPred.predicted_away_score ? finalPred.predicted_home_team_id :
                             finalPred.predicted_home_score < finalPred.predicted_away_score ? finalPred.predicted_away_team_id : null;
        if (predWinnerId === officialAwards.champion_team_id) { totalPoints += 20; totalCoins += 200; }
      }

      // Subcampeón (+10) -> El perdedor de la FINAL
      if (finalPred && officialAwards.runner_up_team_id) {
        const predLoserId = finalPred.predicted_home_score < finalPred.predicted_away_score ? finalPred.predicted_home_team_id :
                            finalPred.predicted_home_score > finalPred.predicted_away_score ? finalPred.predicted_away_team_id : null;
        if (predLoserId === officialAwards.runner_up_team_id) { totalPoints += 10; totalCoins += 100; }
      }

      // Tercer Lugar (+5) -> Ganador del partido 3RD
      const thirdPred = userPreds.find(p => {
        const rm = matches.find(m => m.id === p.match_id);
        return rm?.stage === '3RD';
      });
      if (thirdPred && officialAwards.third_place_team_id) {
        const predThirdId = thirdPred.predicted_home_score > thirdPred.predicted_away_score ? thirdPred.predicted_home_team_id :
                            thirdPred.predicted_home_score < thirdPred.predicted_away_score ? thirdPred.predicted_away_team_id : null;
        if (predThirdId === officialAwards.third_place_team_id) { totalPoints += 5; totalCoins += 50; }
      }
    }

    userPointsMap[userId] = totalPoints;
    if (uAward) {
      awardsUpdates.push({ ...uAward, total_points: totalPoints, coins: totalCoins });
    } else {
      awardsUpdates.push({ user_id: userId, total_points: totalPoints, coins: totalCoins });
    }
  }

  // Guardado masivo
  for (const update of predictionUpdates) {
    await supabase.from('predictions').update({ points_earned: update.points_earned }).eq('id', update.id);
  }

  const chunkSize = 50;
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
  coins: number;
  trend?: 'UP' | 'DOWN' | 'SAME';
  recentForm?: ('EXACT' | 'WIN' | 'LOSS')[];
}

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const [awardsData, profilesData, matchesResponse, predsData, globalSettings] = await Promise.all([
    fetchAllPaginated('prediction_awards', 'user_id, total_points, coins', 'user_id'),
    fetchAllPaginated('profiles', 'id, username'),
    supabase.from('matches').select('id, match_date, is_finished').eq('is_finished', true),
    fetchAllPaginated('predictions', 'user_id, match_id, points_earned'),
    fetchGlobalSettings()
  ]);

  const profilesMap: Record<string, string> = {};
  if (profilesData) {
    profilesData.forEach((p: any) => {
      profilesMap[p.id] = p.username;
    });
  }

  const matches = (matchesResponse.data || []).sort((a, b) => {
    if (a.match_date && b.match_date) return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
    return a.id.localeCompare(b.id);
  });
  const predictions = predsData || [];

  const lastMatch = matches.length > 0 ? matches[matches.length - 1] : null;
  const last3Matches = matches.slice(-3); // Toma los últimos 3

  const baseEntries = (awardsData || []).map((row: any) => {
    const rawCoins = row.coins !== undefined && row.coins !== null ? row.coins : 100;
    const spent = globalSettings.user_expenses[row.user_id] || 0;
    
    return {
      userId: row.user_id,
      username: profilesMap[row.user_id] || row.user_id.substring(0, 8),
      totalPoints: row.total_points || 0,
      coins: rawCoins - spent,
      oldPoints: row.total_points || 0
    };
  });

  if (lastMatch) {
    baseEntries.forEach(entry => {
      const pred = predictions.find(p => p.user_id === entry.userId && p.match_id === lastMatch.id);
      if (pred) {
        entry.oldPoints -= (pred.points_earned || 0);
      }
    });
  }

  const oldEntries = [...baseEntries].sort((a, b) => b.oldPoints - a.oldPoints);
  const oldPosMap: Record<string, number> = {};
  oldEntries.forEach((e, idx) => { oldPosMap[e.userId] = idx + 1; });

  const currentEntries = [...baseEntries].sort((a, b) => b.totalPoints - a.totalPoints);
  
  const entries: LeaderboardEntry[] = currentEntries.map((e, idx) => {
    const currentPos = idx + 1;
    const oldPos = oldPosMap[e.userId] || currentPos;
    
    let trend: 'UP' | 'DOWN' | 'SAME' = 'SAME';
    if (currentPos < oldPos) trend = 'UP';
    if (currentPos > oldPos) trend = 'DOWN';

    const recentForm: ('EXACT' | 'WIN' | 'LOSS')[] = [];
    last3Matches.forEach(m => {
      const pred = predictions.find(p => p.user_id === e.userId && p.match_id === m.id);
      if (!pred) {
        recentForm.push('LOSS');
      } else {
        const pts = pred.points_earned || 0;
        if (pts >= 5) recentForm.push('EXACT');
        else if (pts >= 3) recentForm.push('WIN');
        else recentForm.push('LOSS');
      }
    });

    return {
      userId: e.userId,
      username: e.username,
      totalPoints: e.totalPoints,
      coins: e.coins,
      trend,
      recentForm
    };
  });

  return entries;
};
