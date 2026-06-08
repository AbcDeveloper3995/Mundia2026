import { supabase } from '@/services/supabase';
import { fetchLeaderboard, type LeaderboardEntry, type Prediction, type PredictionAwards } from '@/modules/predictions/services/predictions.service';
import { fetchAllMatches, fetchTeams, type Match } from '@/modules/admin/services/admin.service';

export interface MatchStatsInfo {
  matchName: string;
  hits: number;
  homeName: string;
  awayName: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface DashboardStats {
  // Main KPIs
  position: number;
  totalParticipants: number;
  totalPoints: number;
  distanceToLeader: number | null;
  distanceToNext: number | null;
  precision: number; // percentage
  exactMatches: number;
  correctWinners: number;
  topChampions: { teamName: string; flag: string | null; count: number }[];
  topMvp: { name: string; count: number } | null;
  topScorer: { name: string; count: number } | null;

  // Fun Stats
  nostradamus: { username: string; count: number } | null;
  suertudo: { username: string; points: number } | null;
  mufa: { username: string; percentage: number } | null;
  casiCasi: { username: string; count: number } | null;
  francotirador: { username: string; percentage: number } | null;
  rachaActual: number;
  reyEliminatorias: { username: string; points: number } | null;
  visionario: { username: string; points: number } | null;

  // Rivalry
  rival: { username: string; points: number; distance: number; ahead: boolean } | null;

  // Global Widgets
  podium: LeaderboardEntry[];
  hardestMatch: MatchStatsInfo | null;
  easiestMatch: MatchStatsInfo | null;
}

export const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  // 1. Fetch all required data in parallel
  const [leaderboard, matches, teams, { data: predsData }, { data: awardsData }] = await Promise.all([
    fetchLeaderboard(),
    fetchAllMatches(),
    fetchTeams(),
    supabase.from('predictions').select('*'),
    supabase.from('prediction_awards').select('*')
  ]);

  const predictions = (predsData || []) as Prediction[];
  const awards = (awardsData || []) as PredictionAwards[];

  // --- MAIN KPIs ---
  const myIndex = leaderboard.findIndex(entry => entry.userId === userId);
  const position = myIndex !== -1 ? myIndex + 1 : 0;
  const myEntry = myIndex !== -1 ? leaderboard[myIndex] : null;
  const totalPoints = myEntry?.totalPoints || 0;

  let distanceToLeader = null;
  let distanceToNext = null;

  if (leaderboard.length > 0 && myIndex > 0) {
    distanceToLeader = leaderboard[0].totalPoints - totalPoints;
    distanceToNext = leaderboard[myIndex - 1].totalPoints - totalPoints;
  }

  const myPredictions = predictions.filter(p => p.user_id === userId);
  const myFinishedMatches = myPredictions.filter(p => {
    const match = matches.find(m => m.id === p.match_id);
    return match?.is_finished;
  });

  let correctWinners = 0;
  let exactMatches = 0;

  myFinishedMatches.forEach(p => {
    const match = matches.find(m => m.id === p.match_id);
    if (match && match.home_score !== null && match.away_score !== null) {
      const homeDiff = Math.abs(p.predicted_home_score - match.home_score);
      const awayDiff = Math.abs(p.predicted_away_score - match.away_score);
      if (homeDiff === 0 && awayDiff === 0) {
        exactMatches++;
        correctWinners++;
      } else {
        const actualWinner = match.home_score > match.away_score ? 'HOME' : match.home_score < match.away_score ? 'AWAY' : 'DRAW';
        const predWinner = p.predicted_home_score > p.predicted_away_score ? 'HOME' : p.predicted_home_score < p.predicted_away_score ? 'AWAY' : 'DRAW';
        if (actualWinner === predWinner) correctWinners++;
      }
    }
  });

  const precision = myFinishedMatches.length > 0 ? Math.round((correctWinners / myFinishedMatches.length) * 100) : 0;

  // --- FUN STATS (Premios) ---

  // Agrupar predicciones terminadas por usuario para facilitar cálculos
  const userStats: Record<string, { total: number; exact: number; correct: number; casiCasi: number; eliminatoriasPoints: number }> = {};
  
  leaderboard.forEach(entry => {
    userStats[entry.userId] = { total: 0, exact: 0, correct: 0, casiCasi: 0, eliminatoriasPoints: 0 };
  });

  predictions.forEach(p => {
    const match = matches.find(m => m.id === p.match_id);
    if (!match || !match.is_finished || !userStats[p.user_id]) return;

    userStats[p.user_id].total++;
    
    if (match.home_score !== null && match.away_score !== null) {
      const homeDiff = Math.abs(p.predicted_home_score - match.home_score);
      const awayDiff = Math.abs(p.predicted_away_score - match.away_score);
      const isExact = homeDiff === 0 && awayDiff === 0;
      
      const actualWinner = match.home_score > match.away_score ? 'HOME' : match.home_score < match.away_score ? 'AWAY' : 'DRAW';
      const predWinner = p.predicted_home_score > p.predicted_away_score ? 'HOME' : p.predicted_home_score < p.predicted_away_score ? 'AWAY' : 'DRAW';
      const isCorrect = actualWinner === predWinner;

      if (isExact) userStats[p.user_id].exact++;
      if (isCorrect) userStats[p.user_id].correct++;

      // Casi Casi (diferencia de 1 gol exacto)
      if (!isExact) {
        if ((homeDiff === 1 && awayDiff === 0) || (homeDiff === 0 && awayDiff === 1)) {
          userStats[p.user_id].casiCasi++;
        }
      }
    }

    if (match.stage !== 'GROUP') {
      userStats[p.user_id].eliminatoriasPoints += (p.points_earned || 0);
    }
  });

  // Calculate winners for each category
  const findWinner = (scorer: (uid: string) => number, minTotalMatches: number = 0, reverse: boolean = false) => {
    let bestUid: string | null = null;
    let bestScore = reverse ? Infinity : -Infinity;

    Object.keys(userStats).forEach(uid => {
      if (userStats[uid].total >= minTotalMatches) {
        const score = scorer(uid);
        if (reverse ? score < bestScore : score > bestScore) {
          bestScore = score;
          bestUid = uid;
        }
      }
    });

    if (!bestUid) return null;
    return {
      username: leaderboard.find(l => l.userId === bestUid)?.username || 'Desconocido',
      score: bestScore
    };
  };

  const nostradamusRaw = findWinner(uid => userStats[uid].exact);
  const nostradamus = nostradamusRaw && nostradamusRaw.score > 0 ? { username: nostradamusRaw.username, count: nostradamusRaw.score } : null;

  const suertudoRaw = findWinner(uid => {
    if (userStats[uid].exact > 0) return -1;
    const lEntry = leaderboard.find(l => l.userId === uid);
    return lEntry ? lEntry.totalPoints : -1;
  });
  const suertudo = suertudoRaw && suertudoRaw.score > 0 ? { username: suertudoRaw.username, points: suertudoRaw.score } : null;

  const mufaRaw = findWinner(uid => (userStats[uid].correct / userStats[uid].total) * 100, 1, true); // Min 1 match
  const mufa = mufaRaw && mufaRaw.score >= 0 ? { username: mufaRaw.username, percentage: Math.round(mufaRaw.score) } : null;

  const casiCasiRaw = findWinner(uid => userStats[uid].casiCasi);
  const casiCasi = casiCasiRaw && casiCasiRaw.score > 0 ? { username: casiCasiRaw.username, count: casiCasiRaw.score } : null;

  const francotiradorRaw = findWinner(uid => (userStats[uid].exact / userStats[uid].total) * 100, 1); // Min 1 match
  const francotirador = francotiradorRaw && francotiradorRaw.score > 0 ? { username: francotiradorRaw.username, percentage: Math.round(francotiradorRaw.score) } : null;

  const reyEliminatoriasRaw = findWinner(uid => userStats[uid].eliminatoriasPoints);
  const reyEliminatorias = reyEliminatoriasRaw && reyEliminatoriasRaw.score > 0 ? { username: reyEliminatoriasRaw.username, points: reyEliminatoriasRaw.score } : null;

  // Visionario (premios especiales)
  let bestVisionario = { username: '', points: -1 };
  awards.forEach(a => {
    let vp = 0;
    if (a.top_scorer || a.top_assist || a.mvp) {
      vp += 10; 
    }
    if (vp > bestVisionario.points) {
      bestVisionario = { username: leaderboard.find(l => l.userId === a.user_id)?.username || '', points: vp };
    }
  });
  const visionario = bestVisionario.points > 0 ? bestVisionario : null;

  // Racha Actual
  let rachaActual = 0;
  const sortedMyMatches = myFinishedMatches
    .map(p => ({ ...p, match: matches.find(m => m.id === p.match_id) }))
    .filter(m => m.match && m.match.match_date)
    .sort((a, b) => new Date(b.match!.match_date!).getTime() - new Date(a.match!.match_date!).getTime());

  for (const p of sortedMyMatches) {
    if (p.match && p.match.home_score !== null && p.match.away_score !== null) {
      const actualWinner = p.match.home_score > p.match.away_score ? 'HOME' : p.match.home_score < p.match.away_score ? 'AWAY' : 'DRAW';
      const predWinner = p.predicted_home_score > p.predicted_away_score ? 'HOME' : p.predicted_home_score < p.predicted_away_score ? 'AWAY' : 'DRAW';
      if (actualWinner === predWinner) {
        rachaActual++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // --- RIVALRY ---
  let rival = null;
  if (leaderboard.length > 1) {
    if (myIndex > 0) {
      // Rival is the one above
      const r = leaderboard[myIndex - 1];
      rival = { username: r.username, points: r.totalPoints, distance: r.totalPoints - totalPoints, ahead: true };
    } else {
      // I am leader, rival is #2
      const r = leaderboard[1];
      rival = { username: r.username, points: r.totalPoints, distance: totalPoints - r.totalPoints, ahead: false };
    }
  }

  // --- GLOBAL WIDGETS ---
  const podium = leaderboard.slice(0, 3);

  let hardestMatch: MatchStatsInfo | null = null;
  let easiestMatch: MatchStatsInfo | null = null;
  let maxHits = -1;
  let minHits = Infinity;

  const finishedMatchesObj = matches.filter(m => m.is_finished);
  finishedMatchesObj.forEach(m => {
    const matchPreds = predictions.filter(p => p.match_id === m.id);
    let hits = 0;

    matchPreds.forEach(p => {
      if (m.home_score !== null && m.away_score !== null) {
        const matchResult = Math.sign(m.home_score - m.away_score);
        const predResult = Math.sign(p.predicted_home_score - p.predicted_away_score);
        if (matchResult === predResult) {
          hits++;
        }
      }
    });

    const hTeam = teams.find(t => t.id === m.home_team_id);
    const aTeam = teams.find(t => t.id === m.away_team_id);
    const homeName = hTeam ? hTeam.name : 'TBD';
    const awayName = aTeam ? aTeam.name : 'TBD';
    const homeFlag = hTeam?.flag || null;
    const awayFlag = aTeam?.flag || null;
    const matchName = `${homeName} vs ${awayName}`;

    const matchInfo: MatchStatsInfo = {
      matchName,
      hits,
      homeName,
      awayName,
      homeFlag,
      awayFlag,
      homeScore: m.home_score,
      awayScore: m.away_score
    };

    if (hits > maxHits) {
      maxHits = hits;
      easiestMatch = matchInfo;
    }
    // Para el partido más difícil, priorizamos el que tenga menos aciertos.
    // Si hay empate, podemos elegir uno distinto al más fácil si es posible.
    if (matchPreds.length > 0) {
      if (hits < minHits) {
        minHits = hits;
        hardestMatch = matchInfo;
      } else if (hits === minHits && easiestMatch?.matchName === matchInfo.matchName) {
         // Avoid having the same match for both if possible during ties
         // But actually if minHits === maxHits, they will be the same. 
      }
    }
  });

  // Si easiest y hardest resultan ser el mismo (porque todos los partidos tienen los mismos aciertos),
  // podríamos anular uno, pero por ahora los dejamos para ser consistentes con los datos.
  // Sin embargo, si maxHits === minHits y hay más de 1 partido, podemos asignar el hardest al siguiente.
  if (hardestMatch && easiestMatch && (hardestMatch as MatchStatsInfo).matchName === (easiestMatch as MatchStatsInfo).matchName) {
    const otherMatches = finishedMatchesObj.filter(m => {
      const hTeam = teams.find(t => t.id === m.home_team_id);
      const aTeam = teams.find(t => t.id === m.away_team_id);
      const name = `${hTeam?.name || 'TBD'} vs ${aTeam?.name || 'TBD'}`;
      return name !== easiestMatch?.matchName;
    });
    
    if (otherMatches.length > 0) {
      const m = otherMatches[0];
      const matchPreds = predictions.filter(p => p.match_id === m.id);
      let otherHits = 0;
      matchPreds.forEach(p => {
        if (m.home_score !== null && m.away_score !== null) {
          if (Math.sign(m.home_score - m.away_score) === Math.sign(p.predicted_home_score - p.predicted_away_score)) {
            otherHits++;
          }
        }
      });
      const hTeam = teams.find(t => t.id === m.home_team_id);
      const aTeam = teams.find(t => t.id === m.away_team_id);
      hardestMatch = {
        matchName: `${hTeam?.name || 'TBD'} vs ${aTeam?.name || 'TBD'}`,
        hits: otherHits,
        homeName: hTeam?.name || 'TBD',
        awayName: aTeam?.name || 'TBD',
        homeFlag: hTeam?.flag || null,
        awayFlag: aTeam?.flag || null,
        homeScore: m.home_score,
        awayScore: m.away_score
      };
    } else {
      // Si de verdad solo hay 1 partido en total, hardestMatch = null para no repetir.
      hardestMatch = null;
    }
  }

  // --- NEW AWARDS STATS ---
  const championCounts: Record<string, number> = {};
  const mvpCounts: Record<string, number> = {};
  const scorerCounts: Record<string, number> = {};

  awards.forEach(a => {
    if (a.champion_team_id) {
      championCounts[a.champion_team_id] = (championCounts[a.champion_team_id] || 0) + 1;
    }
    if (a.mvp) {
      mvpCounts[a.mvp] = (mvpCounts[a.mvp] || 0) + 1;
    }
    if (a.top_scorer) {
      scorerCounts[a.top_scorer] = (scorerCounts[a.top_scorer] || 0) + 1;
    }
  });

  const topChampions = Object.entries(championCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([teamId, count]) => {
      const t = teams.find(team => team.id === teamId);
      return { teamName: t?.name || 'Desconocido', flag: t?.flag || null, count };
    });

  const getTopPlayer = (counts: Record<string, number>) => {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null;
  };

  const topMvp = getTopPlayer(mvpCounts);
  const topScorer = getTopPlayer(scorerCounts);

  return {
    position,
    totalParticipants: leaderboard.length,
    totalPoints,
    distanceToLeader,
    distanceToNext,
    precision,
    exactMatches,
    correctWinners,
    topChampions,
    topMvp,
    topScorer,
    nostradamus,
    suertudo,
    mufa,
    casiCasi,
    francotirador,
    rachaActual,
    reyEliminatorias,
    visionario,
    rival,
    podium,
    hardestMatch,
    easiestMatch
  };
};
