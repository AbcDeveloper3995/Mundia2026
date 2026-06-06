import { type Match, type Team, type Group } from '@/modules/admin/services/admin.service';

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

  // Process matches
  matches.filter(m => m.is_finished && m.home_score !== null && m.away_score !== null).forEach(m => {
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

  // Sort standings
  return Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });
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

// Generación del Bracket según cruces A-B, C-D, E-F, G-H, I-J, K-L
export const generateBracket = (groups: Group[], allMatches: Match[]) => {
  const groupWinners: Record<string, TeamStanding> = {};
  const groupRunnersUp: Record<string, TeamStanding> = {};
  const groupThirds: TeamStanding[] = [];

  // Ordenar grupos alfabéticamente para asegurar A, B, C...
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  sortedGroups.forEach(group => {
    const groupM = allMatches.filter(m => m.group_id === group.id);
    const std = calculateGroupStandings(group.teams || [], groupM);
    if (std[0]) groupWinners[group.name] = std[0];
    if (std[1]) groupRunnersUp[group.name] = std[1];
    if (std[2]) groupThirds.push(std[2]);
  });

  // Ordenar terceros (mejor a peor) y tomar los 8 mejores
  groupThirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });
  const bestThirds = groupThirds.slice(0, 8);

  const matchups = [];

  // Función auxiliar para emparejar dos grupos (ej. A y B -> 1A vs 2B, 1B vs 2A)
  const pairGroups = (g1Name: string, g2Name: string) => {
    if (groupWinners[g1Name] && groupRunnersUp[g2Name]) {
      matchups.push([groupWinners[g1Name], groupRunnersUp[g2Name]]);
    }
    if (groupWinners[g2Name] && groupRunnersUp[g1Name]) {
      matchups.push([groupWinners[g2Name], groupRunnersUp[g1Name]]);
    }
  };

  // Cruces según la regla: 1A vs 2B, 1B vs 2A, 1C vs 2D...
  const groupPairs = [
    ['A', 'B'], ['C', 'D'], ['E', 'F'], 
    ['G', 'H'], ['I', 'J'], ['K', 'L']
  ];

  groupPairs.forEach(pair => {
    pairGroups(pair[0], pair[1]);
  });

  // Los 8 mejores terceros se enfrentan entre sí (1ero vs 8vo, 2do vs 7mo, 3ero vs 6to, 4to vs 5to)
  for (let i = 0; i < 4; i++) {
    if (bestThirds[i] && bestThirds[7 - i]) {
      matchups.push([bestThirds[i], bestThirds[7 - i]]);
    }
  }

  return matchups;
};
