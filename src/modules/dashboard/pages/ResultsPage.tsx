import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchGroups, fetchAllMatches, fetchTeams, type Group, type Match, type Team } from '@/modules/admin/services/admin.service';
import { calculateGroupStandings, type TeamStanding } from '@/utils/tournament.rules';
import { TournamentBracket } from '@/modules/admin/components/TournamentBracket';
import { motion } from 'framer-motion';

export const ResultsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isBracketOpen, setIsBracketOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, matchesData, teamsData] = await Promise.all([
        fetchGroups(),
        fetchAllMatches(),
        fetchTeams()
      ]);
      setGroups(groupsData);
      setMatches(matchesData);
      setTeams(teamsData);
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
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
          Tablas de Posiciones y Llaves del Torneo en Tiempo Real
        </Typography>
        <Button variant="contained" color="secondary" size="large" onClick={() => setIsBracketOpen(true)} sx={{ fontWeight: 800 }}>
          Ver Árbol del Torneo (Eliminatorias)
        </Button>
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
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }}      key={group.id} sx={{ display: 'flex' }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} style={{ width: '100%', display: 'flex' }}>
                <Paper 
                  sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden', 
                    borderRadius: 4, 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    bgcolor: 'rgba(20, 20, 20, 0.6)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', py: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: 2, fontSize: '1.1rem' }}>GRUPO {group.name}</Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '8fr 2fr 2fr 2fr 2fr 2fr', 
                    bgcolor: 'rgba(255,255,255,0.03)', 
                    p: 1.5, 
                    borderBottom: '1px solid rgba(255,255,255,0.1)' 
                  }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>EQUIPO</Typography>
                    <Typography sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>PJ</Typography>
                    <Typography sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>GF</Typography>
                    <Typography sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>GC</Typography>
                    <Typography sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', color: 'text.secondary' }}>DG</Typography>
                    <Typography sx={{ textAlign: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'primary.main' }}>PTS</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    {standings.map((team, tIdx) => (
                      <Box key={team.team_id} sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '8fr 2fr 2fr 2fr 2fr 2fr', 
                        p: 1.5, 
                        borderBottom: '1px solid rgba(255,255,255,0.03)', 
                        bgcolor: tIdx < 2 ? 'rgba(0, 230, 118, 0.08)' : 'transparent', 
                        alignItems: 'center', 
                        flexGrow: 1, 
                        transition: 'all 0.2s', 
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: tIdx < 2 ? 'primary.main' : 'text.secondary', width: 14 }}>{tIdx + 1}</Typography>
                          {team.flag && <img src={team.flag} alt="" style={{ width: 24, height: 16, borderRadius: 2, objectFit: 'cover' }} />}
                          <Typography variant="body2" sx={{ fontWeight: tIdx < 2 ? 800 : 600, color: tIdx < 2 ? 'text.primary' : 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                            {team.name}
                          </Typography>
                        </Box>
                        <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>{team.played}</Typography>
                        <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>{team.goalsFor}</Typography>
                        <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>{team.goalsAgainst}</Typography>
                        <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</Typography>
                        <Typography sx={{ textAlign: 'center', fontWeight: 900, fontSize: '0.95rem', color: 'primary.main' }}>{team.points}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={isBracketOpen} onClose={() => setIsBracketOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Llaves del Mundial</Typography>
          <IconButton onClick={() => setIsBracketOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#000', p: 0 }}>
          <TournamentBracket matches={matches.filter(m => m.stage !== 'GROUP')} teams={teams} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
