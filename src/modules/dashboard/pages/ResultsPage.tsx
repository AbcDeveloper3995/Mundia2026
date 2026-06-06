import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { fetchGroups, fetchAllMatches, type Group, type Match } from '@/modules/admin/services/admin.service';
import { calculateGroupStandings, type TeamStanding } from '@/utils/tournament.rules';
import { motion } from 'framer-motion';

export const ResultsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, matchesData] = await Promise.all([
        fetchGroups(),
        fetchAllMatches()
      ]);
      setGroups(groupsData);
      setMatches(matchesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress color="primary" /></Box>;

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>
          Resultados Oficiales
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
          Tablas de Posiciones y Llaves del Torneo en Tiempo Real
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Fase de Grupos */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800, color: 'text.primary', borderBottom: '2px solid', borderColor: 'primary.main', pb: 1, display: 'inline-block' }}>
        Fase de Grupos
      </Typography>
      
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {groups.map((group, idx) => {
          const groupMatches = matches.filter(m => m.group_id === group.id);
          const standings = calculateGroupStandings(group.teams || [], groupMatches as any);

          return (
            <Grid item xs={12} md={6} xl={4} key={group.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Paper sx={{ overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(0,0,0,0.3)' }}>
                  <Box sx={{ bgcolor: 'primary.dark', p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'white' }}>GRUPO {group.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography sx={{ width: '40%', fontWeight: 800, fontSize: '0.8rem' }}>EQUIPO</Typography>
                    <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>PJ</Typography>
                    <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>GF</Typography>
                    <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>GC</Typography>
                    <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>DG</Typography>
                    <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 900, fontSize: '0.8rem', color: 'primary.main' }}>PTS</Typography>
                  </Box>
                  
                  {standings.map((team, tIdx) => (
                    <Box key={team.team_id} sx={{ display: 'flex', p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.02)', bgcolor: tIdx < 2 ? 'rgba(46, 125, 50, 0.1)' : 'transparent', alignItems: 'center' }}>
                      <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', width: 12 }}>{tIdx + 1}</Typography>
                        {team.flag && <img src={team.flag} alt="" style={{ width: 20, height: 14, borderRadius: 2 }} />}
                        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</Typography>
                      </Box>
                      <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{team.played}</Typography>
                      <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{team.goalsFor}</Typography>
                      <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{team.goalsAgainst}</Typography>
                      <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</Typography>
                      <Typography sx={{ width: '12%', textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: 'primary.main' }}>{team.points}</Typography>
                    </Box>
                  ))}
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
