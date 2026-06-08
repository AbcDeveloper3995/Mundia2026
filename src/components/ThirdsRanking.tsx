import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import type { Group, Match } from '@/modules/admin/services/admin.service';
import { getThirdsRanking } from '@/utils/tournament.rules';

interface ThirdsRankingProps {
  groups: Group[];
  matches: Match[];
}

export const ThirdsRanking: React.FC<ThirdsRankingProps> = ({ groups, matches }) => {
  const thirds = getThirdsRanking(groups, matches);

  if (!thirds || thirds.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 4, height: '100%' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
        Ranking de Mejores Terceros
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, px: 1 }}>
        <Typography variant="caption" sx={{ width: 30, fontWeight: 'bold', color: 'text.secondary' }}>POS</Typography>
        <Typography variant="caption" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>EQUIPO</Typography>
        <Typography variant="caption" sx={{ width: 30, textAlign: 'center', fontWeight: 'bold', color: 'text.secondary' }}>PTS</Typography>
        <Typography variant="caption" sx={{ width: 30, textAlign: 'center', fontWeight: 'bold', color: 'text.secondary' }}>DIF</Typography>
      </Box>
      <Divider sx={{ mb: 1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {thirds.map((team, index) => {
          const isClassified = index < 8;
          return (
            <Box 
              key={team.team_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                borderRadius: 2,
                bgcolor: isClassified ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                border: '1px solid',
                borderColor: isClassified ? 'success.main' : 'error.dark',
                opacity: isClassified ? 1 : 0.6
              }}
            >
              <Typography sx={{ width: 30, fontWeight: 800, color: isClassified ? 'success.main' : 'text.secondary' }}>
                {index + 1}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                {team.flag ? (
                  <img 
                    src={team.flag} 
                    alt={team.name}
                    style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }}
                  />
                ) : (
                  <Box sx={{ width: 24, height: 16, bgcolor: '#333', borderRadius: 1 }} />
                )}
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {team.name}
                </Typography>
              </Box>

              <Typography sx={{ width: 30, textAlign: 'center', fontWeight: 800 }}>
                {team.points}
              </Typography>
              <Typography sx={{ width: 30, textAlign: 'center', fontWeight: 600, color: 'text.secondary' }}>
                {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: '50%' }} />
          <Typography variant="caption">Clasifican (Top 8)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: '50%' }} />
          <Typography variant="caption">Eliminados</Typography>
        </Box>
      </Box>
    </Paper>
  );
};
