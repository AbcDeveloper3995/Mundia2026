import { supabase } from '@/services/supabase';
import { fetchLeaderboard, type LeaderboardEntry, type Prediction, type PredictionAwards } from '@/modules/predictions/services/predictions.service';
import { fetchAllMatches, fetchTeams, fetchOfficialAwards, type Match } from '@/modules/admin/services/admin.service';

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
  myCoins: number;
  distanceToLeader: number | null;
  distanceToNext: number | null;
  precision: number; // percentage
  exactMatches: number;
  correctWinners: number;
  topChampions: { teamName: string; flag: string | null; count: number }[];
  mvpVotes: { name: string; count: number }[];
  scorerVotes: { name: string; count: number }[];
  assistVotes: { name: string; count: number }[];

  // Fun Stats
  nostradamus: { username: string; count: number } | null;
  suertudo: { username: string; count: number } | null;
  mufa: { username: string; percentage: number } | null;
  casiCasi: { username: string; count: number } | null;
  francotirador: { username: string; percentage: number } | null;
  reyEliminatorias: { username: string; points: number } | null;
  visionario: { username: string; points: number } | null;

  // Rivalry
  rivalry: {
    leader: { username: string; points: number; distance: number } | null;
    ahead: { username: string; points: number; distance: number } | null;
    behind: { username: string; points: number; distance: number } | null;
  } | null;

  // Global Widgets
  podium: LeaderboardEntry[];
  hardestMatch: MatchStatsInfo | null;
  easiestMatch: MatchStatsInfo | null;

  // Admin Info
  adminProgress?: {
    totalSystemUsers: number;
    systemUsernames: string[];
    totalParticipants: number;
    completedCount: number;
    pendingUsers: { username: string; missing: string }[];
    completedUsers: string[];
  };
}

export const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  // 1. Fetch all required data in parallel
  const [leaderboard, matches, teams, { data: predsData }, { data: awardsData }, { data: profilesData }, officialAwards] = await Promise.all([
    fetchLeaderboard(),
    fetchAllMatches(),
    fetchTeams(),
    supabase.from('predictions').select('*'),
    supabase.from('prediction_awards').select('*'),
    supabase.from('profiles').select('id, username'),
    fetchOfficialAwards()
  ]);

  const predictions = (predsData || []) as Prediction[];
  const awards = (awardsData || []) as PredictionAwards[];
  const systemUsers = (profilesData || []).map(p => p.username || 'Desconocido');
  const totalSystemUsers = systemUsers.length;

  // --- MAIN KPIs ---
  const myIndex = leaderboard.findIndex(entry => entry.userId === userId);
  const position = myIndex !== -1 ? myIndex + 1 : 0;
  const myEntry = leaderboard.find(l => l.userId === userId);
  const totalPoints = myEntry?.totalPoints || 0;
  const myCoins = myEntry?.coins !== undefined ? myEntry.coins : 100;

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
      // Proxy simple para puntos en eliminatorias en caso de que points_earned no esté actualizado
      if (match.home_score !== null && match.away_score !== null) {
        const actualWinner = match.home_score > match.away_score ? 'HOME' : match.home_score < match.away_score ? 'AWAY' : 'DRAW';
        const predWinner = p.predicted_home_score > p.predicted_away_score ? 'HOME' : p.predicted_home_score < p.predicted_away_score ? 'AWAY' : 'DRAW';
        if (actualWinner === predWinner) {
           userStats[p.user_id].eliminatoriasPoints += 3;
        }
        if (match.home_score === p.predicted_home_score && match.away_score === p.predicted_away_score) {
           userStats[p.user_id].eliminatoriasPoints += 2; // Extra 2 pts for exact
        }
      }
      // userStats[p.user_id].eliminatoriasPoints += (p.points_earned || 0);
    }
  });

  // Calculate winners for each category
  const findWinner = (scorer: (uid: string) => number, minTotalMatches: number = 0, reverse: boolean = false) => {
    let bestUids: string[] = [];
    let bestScore = reverse ? Infinity : -Infinity;

    Object.keys(userStats).forEach(uid => {
      if (userStats[uid].total >= minTotalMatches) {
        const score = scorer(uid);
        if (reverse ? score < bestScore : score > bestScore) {
          bestScore = score;
          bestUids = [uid];
        } else if (score === bestScore) {
          bestUids.push(uid);
        }
      }
    });

    if (bestUids.length === 0) return null;
    
    const usernames = bestUids.map(uid => leaderboard.find(l => l.userId === uid)?.username || 'Desconocido');
    let displayUsername = usernames[0];
    if (usernames.length === 2) {
      displayUsername = `${usernames[0]} y ${usernames[1]}`;
    } else if (usernames.length > 2) {
      displayUsername = `${usernames[0]} y ${usernames.length - 1} más`;
    }

    return {
      username: displayUsername,
      score: bestScore
    };
  };

  const nostradamusRaw = findWinner(uid => userStats[uid].exact);
  const nostradamus = nostradamusRaw && nostradamusRaw.score > 0 ? { username: nostradamusRaw.username, count: nostradamusRaw.score } : null;

  const suertudoRaw = findWinner(uid => userStats[uid].correct);
  const suertudo = suertudoRaw && suertudoRaw.score > 0 ? { username: suertudoRaw.username, count: suertudoRaw.score } : null;

  const mufaRaw = findWinner(uid => (userStats[uid].correct / userStats[uid].total) * 100, 1, true); // Min 1 match
  const mufa = mufaRaw && mufaRaw.score >= 0 ? { username: mufaRaw.username, percentage: Math.round(mufaRaw.score) } : null;

  const casiCasiRaw = findWinner(uid => userStats[uid].casiCasi);
  const casiCasi = casiCasiRaw && casiCasiRaw.score > 0 ? { username: casiCasiRaw.username, count: casiCasiRaw.score } : null;

  const francotiradorRaw = findWinner(uid => (userStats[uid].exact / userStats[uid].total) * 100, 1); // Min 1 match
  const francotirador = francotiradorRaw && francotiradorRaw.score > 0 ? { username: francotiradorRaw.username, percentage: Math.round(francotiradorRaw.score) } : null;

  const reyEliminatoriasRaw = findWinner(uid => userStats[uid].eliminatoriasPoints);
  const reyEliminatorias = reyEliminatoriasRaw && reyEliminatoriasRaw.score > 0 ? { username: reyEliminatoriasRaw.username, points: reyEliminatoriasRaw.score } : null;

  // Visionario (premios especiales)
  let visionario = null;
  const finalMatch = matches.find(m => m.stage === 'FINAL');
  
  if (officialAwards && (officialAwards.top_scorer || officialAwards.top_assist || officialAwards.mvp || officialAwards.champion_team_id)) {
    let maxVisionarioPoints = -1;
    let visionarioWinners: string[] = [];

    awards.forEach(a => {
      let vp = 0;
      if (officialAwards.top_scorer && a.top_scorer === officialAwards.top_scorer) vp += 10;
      if (officialAwards.top_assist && a.top_assist === officialAwards.top_assist) vp += 10;
      if (officialAwards.mvp && a.mvp === officialAwards.mvp) vp += 10;
      
      // Champion is checked from their FINAL match prediction
      if (officialAwards.champion_team_id) {
        const finalPred = predictions.find(p => p.user_id === a.user_id && p.match_id === finalMatch?.id);
        if (finalPred) {
          const predWinnerId = finalPred.predicted_home_score > finalPred.predicted_away_score ? finalPred.predicted_home_team_id :
                               finalPred.predicted_home_score < finalPred.predicted_away_score ? finalPred.predicted_away_team_id : null;
          if (predWinnerId === officialAwards.champion_team_id) vp += 20;
        }
      }

      if (vp > maxVisionarioPoints && vp > 0) {
        maxVisionarioPoints = vp;
        const uname = leaderboard.find(l => l.userId === a.user_id)?.username || '';
        visionarioWinners = uname ? [uname] : [];
      } else if (vp === maxVisionarioPoints && maxVisionarioPoints > 0) {
        const uname = leaderboard.find(l => l.userId === a.user_id)?.username || '';
        if (uname && !visionarioWinners.includes(uname)) {
          visionarioWinners.push(uname);
        }
      }
    });

    if (visionarioWinners.length > 0) {
      let displayUsername = visionarioWinners[0];
      if (visionarioWinners.length === 2) {
        displayUsername = `${visionarioWinners[0]} y ${visionarioWinners[1]}`;
      } else if (visionarioWinners.length > 2) {
        displayUsername = `${visionarioWinners[0]} y ${visionarioWinners.length - 1} más`;
      }
      visionario = { username: displayUsername, points: maxVisionarioPoints };
    }
  }

  // --- RIVALRY ---
  let rivalry = null;
  const maxLeaderboardPoints = leaderboard.length > 0 ? Math.max(...leaderboard.map(l => l.totalPoints)) : 0;

  // Solo hay rivalidad si hay más de 1 en el leaderboard, el usuario actual ESTÁ en el leaderboard (myIndex !== -1),
  // y al menos alguien tiene puntos (> 0) para que tenga sentido competir.
  if (leaderboard.length > 1 && myIndex !== -1 && maxLeaderboardPoints > 0) {
    const leaderUser = leaderboard[0];
    const aheadUser = myIndex > 0 ? leaderboard[myIndex - 1] : null;
    const behindUser = myIndex < leaderboard.length - 1 ? leaderboard[myIndex + 1] : null;

    rivalry = {
      leader: myIndex === 0 ? null : { username: leaderUser.username, points: leaderUser.totalPoints, distance: Math.max(0, leaderUser.totalPoints - totalPoints) },
      ahead: myIndex > 1 ? { username: aheadUser!.username, points: aheadUser!.totalPoints, distance: Math.max(0, aheadUser!.totalPoints - totalPoints) } : null,
      behind: behindUser ? { username: behindUser.username, points: behindUser.totalPoints, distance: Math.max(0, totalPoints - behindUser.totalPoints) } : null
    };
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
  const assistCounts: Record<string, number> = {};

  if (finalMatch) {
    predictions.filter(p => p.match_id === finalMatch.id).forEach(p => {
      let winnerTeamId = null;
      if (p.predicted_home_score > p.predicted_away_score) {
        winnerTeamId = p.predicted_home_team_id;
      } else if (p.predicted_home_score < p.predicted_away_score) {
        winnerTeamId = p.predicted_away_team_id;
      } else if (p.predicted_penalty_winner === 'HOME') {
        winnerTeamId = p.predicted_home_team_id;
      } else if (p.predicted_penalty_winner === 'AWAY') {
        winnerTeamId = p.predicted_away_team_id;
      }

      if (winnerTeamId) {
        championCounts[winnerTeamId] = (championCounts[winnerTeamId] || 0) + 1;
      }
    });
  }

  awards.forEach(a => {
    if (a.mvp) {
      mvpCounts[a.mvp] = (mvpCounts[a.mvp] || 0) + 1;
    }
    if (a.top_scorer) {
      scorerCounts[a.top_scorer] = (scorerCounts[a.top_scorer] || 0) + 1;
    }
    if (a.top_assist) {
      assistCounts[a.top_assist] = (assistCounts[a.top_assist] || 0) + 1;
    }
  });

  const topChampions = Object.entries(championCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([teamId, count]) => {
      const t = teams.find(team => team.id === teamId);
      return { teamName: t?.name || 'Desconocido', flag: t?.flag || null, count };
    });

  const getAllVotedPlayers = (counts: Record<string, number>) => {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  };

  const mvpVotes = getAllVotedPlayers(mvpCounts);
  const scorerVotes = getAllVotedPlayers(scorerCounts);
  const assistVotes = getAllVotedPlayers(assistCounts);

  // --- ADMIN PROGRESS ---
  const totalMatchesCount = matches.length;
  const adminProgress = {
    totalSystemUsers,
    systemUsernames: systemUsers,
    totalParticipants: leaderboard.length,
    completedCount: 0,
    pendingUsers: [] as { username: string; missing: string }[],
    completedUsers: [] as string[]
  };

  const profiles = profilesData || [];
  profiles.forEach(profile => {
    const userId = profile.id;
    const username = profile.username || 'Desconocido';

    const userPredsCount = predictions.filter(p => p.user_id === userId).length;
    const userAwards = awards.find(a => a.user_id === userId);
    
    const hasAllMatches = userPredsCount === totalMatchesCount;
    const hasAllAwards = !!userAwards && !!userAwards.mvp && !!userAwards.top_scorer && !!userAwards.top_assist;

    if (hasAllMatches && hasAllAwards) {
      adminProgress.completedCount++;
      adminProgress.completedUsers.push(username);
    } else {
      let missingParts = [];
      if (!hasAllMatches) missingParts.push(`${totalMatchesCount - userPredsCount} partidos`);
      if (!hasAllAwards) missingParts.push('premios');
      adminProgress.pendingUsers.push({ username: username, missing: missingParts.join(' y ') });
    }
  });

  return {
    position,
    totalParticipants: leaderboard.length,
    totalPoints,
    myCoins,
    distanceToLeader,
    distanceToNext,
    precision,
    exactMatches,
    correctWinners,
    topChampions,
    mvpVotes,
    scorerVotes,
    assistVotes,
    nostradamus,
    suertudo,
    mufa,
    casiCasi,
    francotirador,
    reyEliminatorias,
    visionario,
    rivalry,
    podium,
    hardestMatch,
    easiestMatch,
    adminProgress
  };
};
