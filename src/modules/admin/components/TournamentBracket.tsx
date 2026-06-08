import { Box, Typography, Paper } from '@mui/material';
import { type Match, type Team } from '@/modules/admin/services/admin.service';

interface TournamentBracketProps {
  matches: Match[];
  teams: Team[];
}

export const TournamentBracket = ({ matches, teams }: TournamentBracketProps) => {
  // Helpers
  const getTeam = (id: string | null) => teams.find(t => t.id === id);
  const getMatchesByStage = (stage: string) => 
    matches.filter(m => m.stage === stage).sort((a, b) => a.id.localeCompare(b.id));

  const stages = [
    { key: 'R32', name: 'Dieciseisavos' },
    { key: 'R16', name: 'Octavos' },
    { key: 'QF', name: 'Cuartos' },
    { key: 'SF', name: 'Semifinales' },
    { key: '3RD', name: 'Tercer Lugar' },
    { key: 'FINAL', name: 'Final' }
  ];

  const renderMatchCard = (match: Match) => {
    const home = getTeam(match.home_team_id);
    const away = getTeam(match.away_team_id);

    return (
      <Paper 
        key={match.id}
        sx={{
          width: 180,
          mb: 2,
          p: 1,
          borderRadius: 2,
          border: '1px solid',
          borderColor: match.is_finished ? 'primary.main' : 'rgba(255,255,255,0.1)',
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {home?.flag ? <img src={home.flag} alt="" style={{width: 20, height: 14}}/> : <Box sx={{width: 20, height: 14, bgcolor: '#333'}}/>}
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{home?.name || 'TBD'}</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{match.home_score ?? '-'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {away?.flag ? <img src={away.flag} alt="" style={{width: 20, height: 14}}/> : <Box sx={{width: 20, height: 14, bgcolor: '#333'}}/>}
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{away?.name || 'TBD'}</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{match.away_score ?? '-'}</Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ overflowX: 'auto', p: 4, bgcolor: '#111', borderRadius: 4, minHeight: 600 }}>
      <Box sx={{ display: 'flex', gap: 6, minWidth: 1200 }}>
        {stages.map((stageInfo, sIndex) => {
          const stageM = getMatchesByStage(stageInfo.key);
          
          return (
            <Box key={stageInfo.key} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 3, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                {stageInfo.name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flexGrow: 1 }}>
                {stageM.map(m => renderMatchCard(m))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
