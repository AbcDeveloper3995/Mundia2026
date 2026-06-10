import type { Group, Match, Team } from '@/modules/admin/services/admin.service';
import COMBINATIONS_MATRIX from './fifa_combinations.json';

export interface TeamStanding {
  team_id: string;
  name: string;
  flag: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export const calculateGroupStandings = (teams: Team[], matches: Match[]): TeamStanding[] => {
  const standingsMap: Record<string, TeamStanding> = {};

  // Initialize
  teams.forEach(team => {
    standingsMap[team.id] = {
      team_id: team.id,
      name: team.name,
      flag: team.flag,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    };
  });

  const validMatches = matches.filter(m => m.is_finished && m.home_score !== null && m.away_score !== null);

  // Process global matches
  validMatches.forEach(m => {
    const home = standingsMap[m.home_team_id!];
    const away = standingsMap[m.away_team_id!];
    
    if (!home || !away) return;

    home.played += 1;
    away.played += 1;
    
    home.goalsFor += m.home_score!;
    home.goalsAgainst += m.away_score!;
    home.goalDifference = home.goalsFor - home.goalsAgainst;

    away.goalsFor += m.away_score!;
    away.goalsAgainst += m.home_score!;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (m.home_score! > m.away_score!) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.home_score! < m.away_score!) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      away.drawn += 1;
      away.points += 1;
    }
  });

  const globalStandings = Object.values(standingsMap);

  // Helper to calculate mini-league stats for tied teams
  const getMiniLeagueStats = (tiedTeamIds: string[]) => {
    const miniStandings: Record<string, { points: number, gd: number, gf: number }> = {};
    tiedTeamIds.forEach(id => { miniStandings[id] = { points: 0, gd: 0, gf: 0 }; });

    validMatches.forEach(m => {
      if (tiedTeamIds.includes(m.home_team_id!) && tiedTeamIds.includes(m.away_team_id!)) {
        const home = miniStandings[m.home_team_id!];
        const away = miniStandings[m.away_team_id!];
        
        home.gf += m.home_score!;
        home.gd += (m.home_score! - m.away_score!);
        away.gf += m.away_score!;
        away.gd += (m.away_score! - m.home_score!);
        
        if (m.home_score! > m.away_score!) { home.points += 3; }
        else if (m.home_score! < m.away_score!) { away.points += 3; }
        else { home.points += 1; away.points += 1; }
      }
    });
    return miniStandings;
  };

  // Group teams by global points
  const pointGroups: Record<number, TeamStanding[]> = {};
  globalStandings.forEach(team => {
    if (!pointGroups[team.points]) pointGroups[team.points] = [];
    pointGroups[team.points].push(team);
  });

  const sortedStandings: TeamStanding[] = [];
  const sortedPoints = Object.keys(pointGroups).map(Number).sort((a, b) => b - a);

  sortedPoints.forEach(pts => {
    const tiedTeams = pointGroups[pts];
    
    if (tiedTeams.length === 1) {
      sortedStandings.push(tiedTeams[0]);
    } else {
      // Create a mini-league for the tied teams (H2H step)
      const tiedIds = tiedTeams.map(t => t.team_id);
      const miniStats = getMiniLeagueStats(tiedIds);

      tiedTeams.sort((a, b) => {
        const aMini = miniStats[a.team_id];
        const bMini = miniStats[b.team_id];

        // Primer paso: Criterios Head-to-Head (H2H)
        if (bMini.points !== aMini.points) return bMini.points - aMini.points;
        if (bMini.gd !== aMini.gd) return bMini.gd - aMini.gd;
        if (bMini.gf !== aMini.gf) return bMini.gf - aMini.gf;

        // Segundo paso: Criterios Globales
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

        // Fallback alfabético (ignora Fair Play - Opción A)
        return a.name.localeCompare(b.name);
      });

      sortedStandings.push(...tiedTeams);
    }
  });

  return sortedStandings;
};

export const getWinner = (match: Match): string | null => {
  if (!match.is_finished || match.home_score === null || match.away_score === null) return null;
  if (match.home_score > match.away_score) return match.home_team_id;
  if (match.home_score < match.away_score) return match.away_team_id;
  
  // Penales
  if (match.home_penalties !== null && match.away_penalties !== null) {
    if (match.home_penalties > match.away_penalties) return match.home_team_id;
    if (match.home_penalties < match.away_penalties) return match.away_team_id;
  }
  return null;
};

export const getThirdsRanking = (groups: Group[], allMatches: Match[]): TeamStanding[] => {
  const groupThirds: TeamStanding[] = [];

  groups.forEach(group => {
    const groupM = allMatches.filter(m => m.group_id === group.id);
    const std = calculateGroupStandings(group.teams || [], groupM);
    if (std[2]) groupThirds.push(std[2]);
  });

  // Ordenar terceros (mejor a peor)
  return groupThirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });
};

// Generación del Bracket según cruces
export const generateBracket = (groups: Group[], allMatches: Match[]) => {
  const groupWinners: Record<string, TeamStanding> = {};
  const groupRunnersUp: Record<string, TeamStanding> = {};

  // Ordenar grupos alfabéticamente para asegurar A, B, C...
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  sortedGroups.forEach(group => {
    const groupM = allMatches.filter(m => m.group_id === group.id);
    const std = calculateGroupStandings(group.teams || [], groupM);
    if (std[0]) groupWinners[group.name] = std[0];
    if (std[1]) groupRunnersUp[group.name] = std[1];
  });

  const rankedThirds = getThirdsRanking(groups, allMatches);
  const bestThirds = rankedThirds.slice(0, 8);


  const leftBracket: (TeamStanding[])[] = [];
  const rightBracket: (TeamStanding[])[] = [];

  const W = groupWinners;
  const R = groupRunnersUp;
  // Leer los terceros ordenados y la combinación
  const T = [...bestThirds];
  const thirdGroupLetters = T.map(t => {
    // team_id en el Mundial suele ser "A1", "A2", etc. Si la BD es distinta, hay que extraer la letra.
    // Asumimos que podemos buscar el grupo en teams, pero group.name ya tiene la letra.
    const g = groups.find(g => g.id === t.team_id || g.teams?.some(team => team.id === t.team_id));
    return g ? g.name : '';
  }).filter(Boolean);

  thirdGroupLetters.sort((a, b) => a.localeCompare(b));
  const combinationKey = thirdGroupLetters.join('');

  if (combinationKey.length !== 8) {
    console.warn(`Se esperaban 8 mejores terceros, pero se obtuvieron ${combinationKey.length}. Llaves incompletas.`);
    return []; // No crashear la UI, simplemente retornar un bracket vacío hasta que haya 8
  }

  // Importar tabla dinámica o tener un fallback si se prefiere no importar estáticamente
  // Usaremos import dinámico o import estático arriba, vamos a importarlo arriba.
  const allocation = COMBINATIONS_MATRIX[combinationKey as keyof typeof COMBINATIONS_MATRIX];

  if (!allocation) {
    console.error(`Combinación inválida: No existe la asignación FIFA para los terceros clasificados de los grupos ${combinationKey}. Verifica los resultados.`);
    return []; // No crashear la UI
  }

  // Helper para asignar
  const pair = (team1: TeamStanding | undefined, team2: TeamStanding | undefined) => {
    if (team1 && team2) return [team1, team2];
    return [];
  };

  const getThirdForWinner = (winnerGroupName: string) => {
    // allocation['WA'] -> 'B' (el tercero del grupo B)
    const targetGroupLetter = (allocation as any)[`W${winnerGroupName}`];
    const thirdTeam = T.find(t => {
      const g = groups.find(group => group.teams?.some(team => team.id === t.team_id));
      return g?.name === targetGroupLetter;
    });
    return thirdTeam;
  };

  // Lado Izquierdo (Partidos 1 al 8)
  leftBracket.push(pair(W['E'], getThirdForWinner('E'))); // M1: 1E vs 3 (A/B/C/D/F)
  leftBracket.push(pair(W['I'], getThirdForWinner('I'))); // M2: 1I vs 3 (C/D/F/G/H)
  leftBracket.push(pair(R['A'], R['B']));                 // M3: 2A vs 2B
  leftBracket.push(pair(W['F'], R['C']));                 // M4: 1F vs 2C
  leftBracket.push(pair(R['K'], R['L']));                 // M5: 2K vs 2L
  leftBracket.push(pair(W['H'], R['J']));                 // M6: 1H vs 2J
  leftBracket.push(pair(W['D'], getThirdForWinner('D'))); // M7: 1D vs 3 (B/E/F/I/J)
  leftBracket.push(pair(W['G'], getThirdForWinner('G'))); // M8: 1G vs 3 (A/E/H/I/J)

  // Lado Derecho (Partidos 9 al 16)
  rightBracket.push(pair(W['C'], R['F']));                 // M9: 1C vs 2F
  rightBracket.push(pair(R['E'], R['I']));                 // M10: 2E vs 2I
  rightBracket.push(pair(W['A'], getThirdForWinner('A'))); // M11: 1A vs 3 (C/E/F/H/I)
  rightBracket.push(pair(W['L'], getThirdForWinner('L'))); // M12: 1L vs 3 (E/H/I/J/K)
  rightBracket.push(pair(W['J'], R['H']));                 // M13: 1J vs 2H
  rightBracket.push(pair(R['D'], R['G']));                 // M14: 2D vs 2G
  rightBracket.push(pair(W['B'], getThirdForWinner('B'))); // M15: 1B vs 3 (E/F/G/I/J)
  rightBracket.push(pair(W['K'], getThirdForWinner('K'))); // M16: 1K vs 3 (D/E/I/J/L)

  const matchups = [...leftBracket, ...rightBracket].filter(m => m.length === 2);

  return matchups;
};
