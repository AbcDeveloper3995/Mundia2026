import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, CircularProgress, Paper } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { fetchAllMatches, fetchTeams, type Match, type Team } from '@/modules/admin/services/admin.service';
import { fetchUserPredictions, fetchUserAwards, type Prediction, type PredictionAwards } from '@/modules/predictions/services/predictions.service';

interface SpyViewerModalProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  tierId: 'recent' | 'groups' | 'knockouts' | 'awards';
}

export const SpyViewerModal = ({ open, onClose, targetId, targetName, tierId }: SpyViewerModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [awards, setAwards] = useState<PredictionAwards | null>(null);

  useEffect(() => {
    if (open) loadData();
  }, [open, targetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matchesData, teamsData, predsData, awardsData] = await Promise.all([
        fetchAllMatches(),
        fetchTeams(),
        fetchUserPredictions(targetId),
        fetchUserAwards(targetId)
      ]);

      let filteredMatches = [...matchesData];

      if (tierId === 'recent') {
        const STAGE_ORDER: Record<string, number> = { 'GROUP': 0, 'R32': 1, 'R16': 2, 'QF': 3, 'SF': 4, 'THIRD_PLACE': 5, 'FINAL': 6 };
        const finished = matchesData.filter(m => m.is_finished).sort((a, b) => {
          const dateA = a.match_date ? new Date(a.match_date).getTime() : 0;
          const dateB = b.match_date ? new Date(b.match_date).getTime() : 0;
          if (dateA > 0 && dateB > 0 && dateA !== dateB) return dateB - dateA;

          const stageA = STAGE_ORDER[a.stage] || 0;
          const stageB = STAGE_ORDER[b.stage] || 0;
          if (stageA !== stageB) return stageB - stageA;

          if (a.stage === 'GROUP') {
             const teamA = a.home_team_id ? teamsData.find(t => t.id === a.home_team_id) : null;
             const teamB = b.home_team_id ? teamsData.find(t => t.id === b.home_team_id) : null;
             const groupA = teamA?.group?.name || '';
             const groupB = teamB?.group?.name || '';
             if (groupA !== groupB) return groupB.localeCompare(groupA);
          }
          return 0;
        });
        filteredMatches = finished.slice(0, 2);
      } else if (tierId === 'groups') {
        filteredMatches = matchesData.filter(m => m.stage === 'GROUP');
      } else if (tierId === 'knockouts') {
        const STAGE_ORDER: Record<string, number> = { 'R32': 1, 'R16': 2, 'QF': 3, 'SF': 4, 'THIRD_PLACE': 5, 'FINAL': 6 };
        filteredMatches = matchesData.filter(m => m.stage !== 'GROUP').sort((a, b) => {
          const orderA = STAGE_ORDER[a.stage] || 99;
          const orderB = STAGE_ORDER[b.stage] || 99;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.match_date || 0).getTime() - new Date(b.match_date || 0).getTime();
        });
      } else if (tierId === 'awards') {
        filteredMatches = [];
      }

      setMatches(filteredMatches);
      setTeams(teamsData);
      setPredictions(predsData);
      setAwards(awardsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMatchCard = (match: Match) => {
    const pred = predictions.find(p => p.match_id === match.id);
    const homeTeamId = pred?.predicted_home_team_id || match.home_team_id;
    const awayTeamId = pred?.predicted_away_team_id || match.away_team_id;

    const home = teams.find(t => t.id === homeTeamId);
    const away = teams.find(t => t.id === awayTeamId);

    const isPredicted = pred && pred.predicted_home_score !== -1 && pred.predicted_away_score !== -1;

    return (
      <Box key={match.id}>
        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {match.stage === 'GROUP' ? `Grupo ${match.group_id}` : match.stage}
            </Typography>
            {match.is_finished && (
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800, bgcolor: 'rgba(0,230,118,0.1)', px: 1, py: 0.5, borderRadius: 1 }}>
                Puntos: {pred?.points_earned || 0}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              {home?.flag ? <img src={home.flag} alt="" style={{width: 32, height: 24, objectFit: 'cover', borderRadius: 4, marginBottom: 4}}/> : <Box sx={{width: 32, height: 24, bgcolor: '#333', mb: 0.5, borderRadius: 1}}/>}
              <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{home?.name || 'TBD'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40%', gap: 1 }}>
              {isPredicted ? (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>{pred.predicted_home_score}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 900 }}>-</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>{pred.predicted_away_score}</Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 700 }}>Sin Predicción</Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              {away?.flag ? <img src={away.flag} alt="" style={{width: 32, height: 24, objectFit: 'cover', borderRadius: 4, marginBottom: 4}}/> : <Box sx={{width: 32, height: 24, bgcolor: '#333', mb: 0.5, borderRadius: 1}}/>}
              <Typography variant="caption" sx={{ fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{away?.name || 'TBD'}</Typography>
            </Box>
          </Box>

          {!match.is_finished && isPredicted && match.stage !== 'GROUP' && pred.predicted_home_score === pred.predicted_away_score && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 800 }}>
                Penales: {pred.predicted_penalty_winner === 'HOME' ? home?.name : away?.name}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { bgcolor: '#1a1a1a', backgroundImage: 'none', borderRadius: 4, border: '1px solid rgba(0, 229, 255, 0.2)', boxShadow: '0 0 40px rgba(0,229,255,0.1)' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VisibilityIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
            Top Secret: {targetName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
              {tierId === 'recent' && 'Últimos 2 Partidos'}
              {tierId === 'groups' && 'Fase de Grupos'}
              {tierId === 'knockouts' && 'Fase Eliminatoria'}
              {tierId === 'awards' && 'Premios del Torneo'}
            </Typography>

            {tierId === 'awards' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Máximo Goleador</Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900 }}>{awards?.top_scorer || 'No seleccionado'}</Typography>
                </Paper>
                <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>Máximo Asistente</Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900 }}>{awards?.top_assist || 'No seleccionado'}</Typography>
                </Paper>
                <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>MVP del Torneo</Typography>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900 }}>{awards?.mvp || 'No seleccionado'}</Typography>
                </Paper>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {matches.length === 0 ? (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>No hay partidos para mostrar en esta categoría.</Typography>
                  </Box>
                ) : (
                  matches.map(m => renderMatchCard(m))
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
